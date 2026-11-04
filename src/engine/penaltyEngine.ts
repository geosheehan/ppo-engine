import { assessPenalties, STRENGTH_SEVERITIES } from '@engine/assessment';
import type { CalledPenalty } from '@engine/assessment';
import { PenaltyBox } from '@engine/penaltyBox';
import { PlayGroup } from '@engine/playGroup';
import { isSameStrength, isThreeOnThreeOvertime, OnIceStrength } from '@engine/strength';
import type {
   GoalEffect,
   PenaltyEndReason,
   PenaltyEngineResult,
   ServedPenalty,
   Strength,
   StrengthInterval,
   TimelineEntry,
} from '@engine/types';
import { PENALTY_SEVERITIES, PERIOD_TYPES, PLAY_TYPES, SIDES } from '@domain/constants';
import type { GameIndex } from '@domain/game';
import { playTime } from '@domain/plays';
import type { Game, GameElapsed, GoalPlay, PenaltyPlay, Play, Side } from '@domain/types';
import { otherSide } from '@domain/types';

export function runPenaltyEngine(index: GameIndex): PenaltyEngineResult {
   return new PenaltyEngine(index).run();
}

class PenaltyEngine {
   private readonly game: Game;
   private readonly plays: Play[];
   private readonly sideOf: (teamId: number) => Side;
   private readonly timeline: TimelineEntry[] = [];
   private readonly record = (entry: TimelineEntry) => this.timeline.push(entry);
   private readonly penaltyBoxes: Record<Side, PenaltyBox> = {
      away: new PenaltyBox(SIDES.AWAY, this.record),
      home: new PenaltyBox(SIDES.HOME, this.record),
   };
   private readonly onIce = new OnIceStrength();
   private readonly servedPenalties: ServedPenalty[] = [];
   private readonly strengthIntervals: StrengthInterval[] = [];
   private readonly goals: GoalEffect[] = [];
   private strengthStart: GameElapsed = 0;
   // The latest game time the engine has reached, in game seconds like playTime.
   private currentTime: GameElapsed = 0;
   private gameEnd: GameElapsed | undefined;

   constructor({ game, plays, sideOf }: GameIndex) {
      this.game = game;
      this.plays = plays;
      this.sideOf = sideOf;
   }

   run(): PenaltyEngineResult {
      let group: PlayGroup | undefined;
      for (const play of this.plays) {
         if (play.periodDescriptor.periodType === PERIOD_TYPES.SHOOTOUT) continue;

         const time = playTime(play);
         if (play.typeDescKey === PLAY_TYPES.GAME_END) this.gameEnd = time;
         if (group?.time !== time) {
            if (group) this.resolve(group);
            group = new PlayGroup(time);
         }
         group.add(play);
      }
      if (group) this.resolve(group);

      this.finish();
      return {
         timeline: this.timeline,
         servedPenalties: this.servedPenalties,
         strengthIntervals: this.strengthIntervals,
         goals: this.goals,
      };
   }

   // Penalties run out between plays. Each expiry can start a queued penalty, which may itself
   // run out before `time`, so keep going until nothing expires before it.
   private advanceTo(time: GameElapsed, reason: PenaltyEndReason = 'expired'): void {
      for (;;) {
         const next = earliest(
            this.penaltyBoxes.away.nextExpiry(),
            this.penaltyBoxes.home.nextExpiry(),
         );
         if (next === undefined || next > time) break;
         this.servedPenalties.push(
            ...this.penaltyBoxes.away.expireAt(next, reason),
            ...this.penaltyBoxes.home.expireAt(next, reason),
         );
         this.updateStrength(next, false);
      }
      this.currentTime = Math.max(this.currentTime, time);
   }

   // Goals go before the second's penalties: a goal applies to the penalties already running, and a penalty
   // recorded with it was either a delayed call or came after it.
   private resolve(group: PlayGroup): void {
      this.advanceTo(group.time);
      const washed = new Set<number>();
      for (const goal of group.goals) this.handleGoal(goal, group, washed);
      if (group.penalties.length > 0) this.handlePenalties(group, washed);
      if (group.hasFaceoff) this.updateStrength(group.time, true);
   }

   private handleGoal(goal: GoalPlay, group: PlayGroup, washed: Set<number>): void {
      const time = group.time;
      const side = this.sideOf(goal.details.eventOwnerTeamId);
      const against = otherSide(side);
      const strengthAtGoal = this.onIce.current;
      const penaltyShot = group.isPenaltyShot(goal);
      const effect: GoalEffect = {
         goalEventId: goal.eventId,
         side,
         strength: strengthAtGoal,
         penaltyShot,
      };

      // Rule 16.2: only a team that is short-handed when the goal is scored has a minor released.
      let released: ServedPenalty | undefined;
      if (!penaltyShot && strengthAtGoal[against] < strengthAtGoal[side]) {
         released = this.penaltyBoxes[against].releaseOnGoal(time, goal.eventId);
         if (released) {
            this.servedPenalties.push(released);
            effect.releasedPenaltyEventId = released.penaltyEventId;
         }
      }

      // A goal on a delayed minor washes it out, or the first half of a delayed double minor (Rule 18.2), unless it
      // released a minor that was already running. A delayed major is always served.
      const delayed = penaltyShot ? undefined : group.delayedPenalty(goal);
      if (delayed && !released && isMinor(delayed)) {
         washed.add(delayed.eventId);
         effect.washedPenaltyId = delayed.eventId;
      }

      this.goals.push(effect);
      this.record({ kind: 'goal', time, goal: effect });
      this.updateStrength(time, true);
   }

   private handlePenalties(group: PlayGroup, washed: Set<number>): void {
      const penalties: CalledPenalty[] = [];
      for (const penalty of group.penalties) {
         const isWashed = washed.has(penalty.eventId);
         if (
            !STRENGTH_SEVERITIES.has(penalty.details.typeCode)
            || (isWashed && !isDoubleMinor(penalty))
         )
            continue;
         penalties.push({
            eventId: penalty.eventId,
            side: this.sideOf(penalty.details.eventOwnerTeamId),
            playerKey:
               penalty.details.committedByPlayerId
               ?? penalty.details.servedByPlayerId
               ?? -penalty.eventId,
            severity: penalty.details.typeCode,
            minutes: penalty.details.duration,
            doubleMinorFirstHalfWashed: isWashed,
         });
      }

      const inEffect = !this.penaltyBoxes.away.isEmpty || !this.penaltyBoxes.home.isEmpty;
      for (const sentence of assessPenalties(penalties, inEffect)) {
         this.penaltyBoxes[sentence.side].add(sentence, group.time);
      }
      this.updateStrength(group.time, true);
   }

   // A finished game closes everything when it ended; a game in progress lets penalties
   // run their full length so the chart can still draw them.
   private finish(): void {
      const { gameEnd } = this;
      if (gameEnd !== undefined) {
         this.advanceTo(gameEnd);
         this.servedPenalties.push(
            ...this.penaltyBoxes.away.closeAll(gameEnd, 'gameEnd'),
            ...this.penaltyBoxes.home.closeAll(gameEnd, 'gameEnd'),
         );
         this.updateStrength(gameEnd, true);
         this.closeStrengthInterval(gameEnd);
      } else {
         this.advanceTo(Infinity, 'projected');
         this.closeStrengthInterval(this.currentTime);
      }
   }

   private updateStrength(time: GameElapsed, atStoppage: boolean): void {
      const prevStrength = this.onIce.current;
      const running: Strength = {
         away: this.penaltyBoxes.away.runningClockCount,
         home: this.penaltyBoxes.home.runningClockCount,
      };
      const nextStrength = this.onIce.update(
         running,
         isThreeOnThreeOvertime(this.game, time),
         atStoppage,
      );
      if (!isSameStrength(prevStrength, nextStrength)) {
         this.record({ kind: 'strength', time, strength: nextStrength });
         this.closeStrengthInterval(time, prevStrength);
         this.strengthStart = time;
      }
      this.currentTime = Math.max(this.currentTime, time);
   }

   private closeStrengthInterval(time: GameElapsed, strength: Strength = this.onIce.current): void {
      if (time > this.strengthStart)
         this.strengthIntervals.push({ ...strength, start: this.strengthStart, end: time });
   }
}

const earliest = (...times: (GameElapsed | undefined)[]) => {
   const defined = times.filter((time): time is GameElapsed => time !== undefined);
   return defined.length > 0 ? Math.min(...defined) : undefined;
};

const isMinor = (penalty: PenaltyPlay) =>
   penalty.details.typeCode === PENALTY_SEVERITIES.MINOR
   || penalty.details.typeCode === PENALTY_SEVERITIES.BENCH_MINOR;

const isDoubleMinor = (penalty: PenaltyPlay) => isMinor(penalty) && penalty.details.duration === 4;
