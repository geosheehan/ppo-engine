import type { Game, GameElapsed, GoalPlay, PenaltyPlay, Play, Side } from '@domain/types';
import { isGoal, isPenalty, otherSide } from '@domain/types';
import type { GameIndex } from '@domain/game';
import { playTime } from '@domain/plays';
import { PenaltyBox } from '@engine/penaltyBox';
import { STRENGTH_SEVERITIES, assessPenalties } from '@engine/assessment';
import type { CalledPenalty } from '@engine/assessment';
import { OnIceStrength, isSameStrength, isThreeOnThreeOvertime } from '@engine/strength';
import type { GoalEffect, PenaltyEndReason, PenaltyEngineResult, ServedPenalty, Strength, StrengthInterval } from '@engine/types';

export function runPenaltyEngine(index: GameIndex): PenaltyEngineResult {
   return new PenaltyEngine(index).run();
}

class PenaltyEngine {
   private readonly game: Game;
   private readonly plays: Play[];
   private readonly sideOf: (teamId: number) => Side;
   private readonly penaltyBoxes: Record<Side, PenaltyBox> = { away: new PenaltyBox('away'), home: new PenaltyBox('home') };
   private readonly onIce = new OnIceStrength();
   private readonly servedPenalties: ServedPenalty[] = [];
   private readonly strengthIntervals: StrengthInterval[] = [];
   private readonly goals: GoalEffect[] = [];
   private strengthStart: GameElapsed = 0;
   // The latest game time the engine has reached, in game seconds like playTime.
   private currentTime: GameElapsed = 0;

   constructor({ game, plays, sideOf }: GameIndex) {
      this.game = game;
      this.plays = plays;
      this.sideOf = sideOf;
   }

   run(): PenaltyEngineResult {
      const plays = this.plays.filter((play) => play.periodDescriptor.periodType !== 'SO');
      const penaltiesByTime = groupPenaltiesByTime(plays);
      const assessedTimes = new Set<number>();

      for (const play of plays) {
         const time = playTime(play);
         this.advanceTo(time);

         if (isGoal(play)) {
            this.handleGoal(play, time, plays);
         } else if (isPenalty(play) && !assessedTimes.has(time)) {
            assessedTimes.add(time);
            this.handlePenalties(penaltiesByTime.get(time) ?? [], time, plays);
         } else if (play.typeDescKey === 'faceoff') {
            this.updateStrength(time, true);
         }
      }

      this.finish(plays);
      return { servedPenalties: this.servedPenalties, strengthIntervals: this.strengthIntervals, goals: this.goals };
   }

   // Penalties run out between plays. Each expiry can start a queued penalty, which may itself
   // run out before `time`, so keep going until nothing expires before it.
   private advanceTo(time: GameElapsed, reason: PenaltyEndReason = 'expired'): void {
      for (;;) {
         const next = earliest(this.penaltyBoxes.away.nextExpiry(), this.penaltyBoxes.home.nextExpiry());
         if (next === undefined || next > time) break;
         this.servedPenalties.push(...this.penaltyBoxes.away.expireAt(next, reason), ...this.penaltyBoxes.home.expireAt(next, reason));
         this.updateStrength(next, false);
      }
      this.currentTime = Math.max(this.currentTime, time);
   }

   private handleGoal(goal: GoalPlay, time: GameElapsed, plays: Play[]): void {
      const side = this.sideOf(goal.details.eventOwnerTeamId);
      const against = otherSide(side);
      const strengthAtGoal = this.onIce.current;
      const penaltyShot = isPenaltyShotGoal(goal, plays);
      const effect: GoalEffect = { goalEventId: goal.eventId, side, strength: strengthAtGoal, penaltyShot };

      // Rule 16.2: only a team that is short-handed when the goal is scored has a minor released.
      if (!penaltyShot && strengthAtGoal[against] < strengthAtGoal[side]) {
         const released = this.penaltyBoxes[against].releaseOnGoal(time, goal.eventId);
         if (released) {
            this.servedPenalties.push(released);
            effect.releasedPenaltyEventId = released.penaltyEventId;
         }
      }

      const washedDoubleMinor = delayedDoubleMinorWashedBy(goal, plays, (teamId) => this.sideOf(teamId));
      if (washedDoubleMinor) effect.washedDoubleMinorId = washedDoubleMinor.eventId;

      this.goals.push(effect);
      this.updateStrength(time, true);
   }

   private handlePenalties(called: PenaltyPlay[], time: GameElapsed, plays: Play[]): void {
      const penalties = called
         .filter((penalty) => STRENGTH_SEVERITIES.has(penalty.details.typeCode))
         .map((penalty): CalledPenalty => ({
            eventId: penalty.eventId,
            side: this.sideOf(penalty.details.eventOwnerTeamId),
            playerKey: penalty.details.committedByPlayerId ?? penalty.details.servedByPlayerId ?? -penalty.eventId,
            severity: penalty.details.typeCode,
            minutes: penalty.details.duration,
            doubleMinorFirstHalfWashed: plays.some((play) => isGoal(play)
               && delayedDoubleMinorWashedBy(play, plays, (teamId) => this.sideOf(teamId))?.eventId === penalty.eventId),
         }));

      const inEffect = !this.penaltyBoxes.away.isEmpty || !this.penaltyBoxes.home.isEmpty;
      for (const sentence of assessPenalties(penalties, inEffect)) {
         this.penaltyBoxes[sentence.side].add(sentence, time);
      }
      this.updateStrength(time, true);
   }

   // A finished game closes everything at its last period's end; a game in progress lets penalties
   // run their full length so the chart can still draw them.
   private finish(plays: Play[]): void {
      const gameEnd = findGameEnd(plays);
      if (gameEnd !== undefined) {
         this.advanceTo(gameEnd);
         this.servedPenalties.push(...this.penaltyBoxes.away.closeAll(gameEnd, 'gameEnd'), ...this.penaltyBoxes.home.closeAll(gameEnd, 'gameEnd'));
         this.closeStrengthInterval(gameEnd);
      } else {
         this.advanceTo(Infinity, 'projected');
         this.closeStrengthInterval(this.currentTime);
      }
   }

   private updateStrength(time: GameElapsed, atStoppage: boolean): void {
      const prevStrength = this.onIce.current;
      const running: Strength = { away: this.penaltyBoxes.away.runningClockCount, home: this.penaltyBoxes.home.runningClockCount };
      const nextStrength = this.onIce.update(running, isThreeOnThreeOvertime(this.game, time), atStoppage);
      if (!isSameStrength(prevStrength, nextStrength)) {
         this.closeStrengthInterval(time, prevStrength);
         this.strengthStart = time;
      }
      this.currentTime = Math.max(this.currentTime, time);
   }

   private closeStrengthInterval(time: GameElapsed, strength: Strength = this.onIce.current): void {
      if (time > this.strengthStart) this.strengthIntervals.push({ ...strength, start: this.strengthStart, end: time });
   }
}

const earliest = (...times: (GameElapsed | undefined)[]) => {
   const defined = times.filter((time): time is GameElapsed => time !== undefined);
   return defined.length > 0 ? Math.min(...defined) : undefined;
};

// Penalties called in the same second were called at the same stoppage.
function groupPenaltiesByTime(plays: Play[]): Map<GameElapsed, PenaltyPlay[]> {
   const penaltiesByTime = new Map<GameElapsed, PenaltyPlay[]>();
   for (const play of plays.filter(isPenalty)) {
      const time = playTime(play);
      penaltiesByTime.set(time, [...(penaltiesByTime.get(time) ?? []), play]);
   }
   return penaltiesByTime;
}

function findGameEnd(plays: Play[]): GameElapsed | undefined {
   if (!plays.some((play) => play.typeDescKey === 'game-end')) return undefined;
   return Math.max(...plays.filter((play) => play.typeDescKey === 'period-end' || play.typeDescKey === 'game-end').map(playTime));
}

// Unconfirmed: assumes a penalty-shot goal shares its second with the PS penalty awarded to the other team.
function isPenaltyShotGoal(goal: GoalPlay, plays: Play[]): boolean {
   return plays.some((play) => isPenalty(play)
      && play.details.typeCode === 'PS'
      && play.details.eventOwnerTeamId !== goal.details.eventOwnerTeamId
      && playTime(play) === playTime(goal));
}

// Rule 18.2: a goal scored while a double minor is being signalled washes out its first half.
// Seen in the data as a 4-minute minor to the other team in the same second, recorded after the goal.
// Caveat: a double minor from a scrum after the goal looks the same.
function delayedDoubleMinorWashedBy(goal: GoalPlay, plays: Play[], sideOf: (teamId: number) => Side): PenaltyPlay | undefined {
   const scorer = sideOf(goal.details.eventOwnerTeamId);
   return plays.find((play): play is PenaltyPlay => isPenalty(play)
      && (play.details.typeCode === 'MIN' || play.details.typeCode === 'BEN')
      && play.details.duration === 4
      && sideOf(play.details.eventOwnerTeamId) !== scorer
      && playTime(play) === playTime(goal)
      && play.sortOrder > goal.sortOrder);
}
