import { EN_DASH } from '@layout/constants';
import { momentClock, momentPeriod } from '@layout/penaltyChart';
import type { PenaltyEngineResult, PenaltyStartReason, ServedPenalty } from '@engine/types';
import { secondsToClock } from '@domain/clock';
import { PENALTY_SEVERITIES, PERIOD_SECONDS, SIDES } from '@domain/constants';
import { otherSide } from '@domain/game';
import { periodLabel } from '@domain/labels';
import { playTime } from '@domain/plays';
import type { GameElapsed, PenaltyPlay, Play, Side } from '@domain/types';

export type WhyNote = {
   tag: string | undefined;
   text: string;
};

export type WhyRow = WhyNote & {
   key: string;
   eventId: number;
   side: Side;
   penalty: string;
   served: string;
   time: GameElapsed;
   half: number;
};

export type WhyInput = {
   result: PenaltyEngineResult;
   plays: Play[];
   penalties: PenaltyPlay[];
   regPeriods: number;
   abbrevs: Record<Side, string>;
   gameEnd: GameElapsed;
   sweaterNumberOf: (play: PenaltyPlay) => number | undefined;
};

export type WhyNotes = {
   pieces: ReadonlyMap<string, WhyNote>;
   goals: ReadonlyMap<number, WhyNote>;
   rows: WhyRow[];
};

type Part = { tag?: string; text: string };

const CALLED_TEXT = 'Starts when called';
const EXPIRED_TEXT = 'Served in full';
const NOT_SERVED = 'Not served';
const DOUBLE_MINOR = 'Double minor';

const COINCIDENTAL: Part = {
   tag: '4-on-4',
   text: 'Coincidental minors: served 4-on-4, not released by a goal',
};
const DEQUEUED: Part = {
   tag: 'Waiting',
   text: 'Waiting in the box for a free penalty clock',
};
const FIRST_HALF: Part = { tag: '1st half', text: 'First half of the double minor' };
const SECOND_HALF: Part = { tag: '2nd half', text: 'Second half of the double minor' };
const ADDED: Part = {
   tag: 'Added',
   text: 'Added to the time the player is already serving',
};
const GAME_END: Part = { tag: 'Game over', text: 'Game ended before penalty' };
const IN_BOX: Part = {
   tag: 'Discarded',
   text: 'A player in the box can only take a minor, or be ejected and have their penalty served by a teammate',
};

export const pieceKey = (penalty: { penaltyEventId: number; doubleMinorHalf?: 1 | 2 }): string =>
   `${penalty.penaltyEventId}-${penalty.doubleMinorHalf ?? 0}`;

function penaltyTypeLabel(play: PenaltyPlay): string {
   const { typeCode, duration } = play.details;
   if (typeCode === PENALTY_SEVERITIES.MAJOR || typeCode === PENALTY_SEVERITIES.MATCH)
      return 'Major';
   return duration === 4 ? DOUBLE_MINOR : 'Minor';
}

const startPeriod = (time: GameElapsed): number => Math.floor(time / PERIOD_SECONDS) + 1;

const toNote = (parts: Part[]): WhyNote => {
   const tags = parts.flatMap(({ tag }) => (tag !== undefined ? [tag] : []));
   return {
      tag: tags.length > 0 ? tags.join(', ') : undefined,
      text: parts.map(({ text }) => text).join('. '),
   };
};

export function whyNotes({
   result,
   plays,
   penalties,
   regPeriods,
   abbrevs,
   gameEnd,
   sweaterNumberOf,
}: WhyInput): WhyNotes {
   const penaltyName = (play: PenaltyPlay): string => {
      const number = sweaterNumberOf(play);
      return `${number !== undefined ? `#${number} ` : ''}${penaltyTypeLabel(play)}`;
   };
   const startMoment = (time: GameElapsed): string => {
      const period = startPeriod(time);
      return `${periodLabel(period, regPeriods)} ${secondsToClock(time - (period - 1) * PERIOD_SECONDS)}`;
   };
   const endMoment = (time: GameElapsed): string =>
      `${periodLabel(momentPeriod(time), regPeriods)} ${momentClock(time)}`;
   const served = (start: GameElapsed, end: GameElapsed): string => {
      const sameMoment = startPeriod(start) === momentPeriod(end);
      return `${startMoment(start)} ${EN_DASH} ${sameMoment ? momentClock(end) : endMoment(end)}`;
   };

   const playById = new Map(plays.map((play) => [play.eventId, play]));
   const penaltyById = new Map(penalties.map((play) => [play.eventId, play]));
   const startReasons = new Map<string, PenaltyStartReason>();
   for (const entry of result.timeline) {
      if (entry.kind === 'penaltyStart') startReasons.set(pieceKey(entry.penalty), entry.reason);
   }

   const goalMoment = (goalEventId: number): string => {
      const goal = playById.get(goalEventId);
      return goal ? startMoment(playTime(goal)) : '';
   };

   const nextInSentence = (piece: ServedPenalty): Part => {
      const before = result.servedPenalties.find(
         (other) =>
            other !== piece
            && other.side === piece.side
            && other.penaltyClock === piece.penaltyClock
            && other.end === piece.start,
      );
      const play = penaltyById.get(piece.penaltyEventId);
      const beforePlay = before && penaltyById.get(before.penaltyEventId);
      if (!play || !beforePlay || playTime(play) !== playTime(beforePlay)) return ADDED;
      const kind = before.kind === 'major' ? 'major' : 'minor';
      return {
         tag: `After ${kind}`,
         text: `Starts when the same player's ${kind} ends`,
      };
   };

   const pieceParts = (piece: ServedPenalty): Part[] => {
      const parts: Part[] = [];
      if (piece.coincidental) parts.push(COINCIDENTAL);
      const reason = startReasons.get(pieceKey(piece));
      if (piece.doubleMinorHalf === 1) parts.push(FIRST_HALF);
      if (piece.doubleMinorHalf === 2) parts.push(SECOND_HALF);
      if (reason === 'dequeued') parts.push(DEQUEUED);
      if (reason === 'nextInSentence' && piece.doubleMinorHalf !== 2)
         parts.push(nextInSentence(piece));
      if (piece.endReason === 'goal' && piece.releasedByGoalId !== undefined) {
         const goal = result.goals.find((effect) => effect.goalEventId === piece.releasedByGoalId);
         const team = goal ? `${abbrevs[goal.side]} ` : '';
         parts.push({
            tag: 'Released',
            text: `Released by ${team}goal, ${goalMoment(piece.releasedByGoalId)}`,
         });
      }
      if (piece.endReason === 'gameEnd') parts.push(GAME_END);
      if (piece.endReason === 'expired' && piece.doubleMinorHalf === 1)
         parts.push({ text: EXPIRED_TEXT });
      return parts.length > 0 ? parts : [{ text: CALLED_TEXT }, { text: EXPIRED_TEXT }];
   };

   const pieces = new Map<string, WhyNote>();
   const rows: WhyRow[] = [];
   for (const piece of result.servedPenalties) {
      const play = penaltyById.get(piece.penaltyEventId);
      if (!play || piece.start > piece.end || piece.start >= gameEnd) continue;
      const note = toNote(pieceParts(piece));
      pieces.set(pieceKey(piece), note);
      rows.push({
         ...note,
         key: `served-${pieceKey(piece)}`,
         eventId: piece.penaltyEventId,
         side: piece.side,
         penalty: penaltyName(play),
         served: served(piece.start, Math.min(piece.end, gameEnd)),
         time: piece.start,
         half: piece.doubleMinorHalf ?? 0,
      });
   }

   const notServed = (key: string, eventId: number, side: Side, half: number, part: Part) => {
      const play = penaltyById.get(eventId);
      if (!play) return;
      rows.push({
         ...toNote([part]),
         key,
         eventId,
         side,
         penalty: penaltyName(play),
         served: NOT_SERVED,
         time: playTime(play),
         half,
      });
   };

   const goals = new Map<number, WhyNote>();
   for (const goal of result.goals) {
      if (goal.washedPenaltyId === undefined) continue;
      const washed: Part = {
         tag: 'Washed',
         text: `Washed out by ${abbrevs[goal.side]} goal on the delayed call, ${goalMoment(goal.goalEventId)}`,
      };
      goals.set(goal.goalEventId, toNote([washed]));
      const play = penaltyById.get(goal.washedPenaltyId);
      const doubleMinor = play !== undefined && penaltyTypeLabel(play) === DOUBLE_MINOR;
      notServed(
         `washed-${goal.washedPenaltyId}`,
         goal.washedPenaltyId,
         otherSide(goal.side),
         doubleMinor ? 1 : 0,
         washed,
      );
   }
   const offsetPart = (offsetBy: number | undefined, side: Side): Part => {
      const by = offsetBy !== undefined ? penaltyById.get(offsetBy) : undefined;
      return {
         tag: 'Coincidental',
         text: by ? `Offset by ${abbrevs[otherSide(side)]} ${penaltyName(by)}` : 'Offset',
      };
   };
   for (const discarded of result.discardedPenalties) {
      const { penaltyEventId, side, reason, offsetBy } = discarded;
      notServed(
         `${reason}-${pieceKey(discarded)}`,
         penaltyEventId,
         side,
         discarded.doubleMinorHalf ?? 0,
         reason === 'offsetting' ? offsetPart(offsetBy, side) : IN_BOX,
      );
   }

   rows.sort(
      (a, b) =>
         a.time - b.time
         || Number(a.side !== SIDES.HOME) - Number(b.side !== SIDES.HOME)
         || a.eventId - b.eventId
         || a.half - b.half,
   );
   return { pieces, goals, rows };
}
