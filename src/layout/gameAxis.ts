import { isThreeOnThreeOvertime, strengthAt } from '@engine/strength';
import type { Strength, TimelineEntry } from '@engine/types';
import { PERIOD_TYPES, PLAY_TYPES } from '@domain/constants';
import { isGoal, playTime } from '@domain/plays';
import { lastIndexWhere } from '@domain/search';
import type { Game, GameElapsed, GameIndex, Play, PlayType, Side } from '@domain/types';

// Baseline time (5-on-5, or 3-on-3 in regular-season overtime) shares this part of the timed axis, each piece at
// least MIN_BASELINE wide. Special teams share the rest at one rate, so equal lengths get equal widths.
const BASELINE_SHARE = 0.3;
const MIN_BASELINE = 0.005;
const SHOOTOUT_GAP = 0.01;
const SHOOTOUT_ATTEMPT = 0.015;
const SHOOTOUT_SHOTS: PlayType[] = [
   PLAY_TYPES.GOAL,
   PLAY_TYPES.SHOT_ON_GOAL,
   PLAY_TYPES.MISSED_SHOT,
];

export type PeriodSpan = {
   period: number;
   start: GameElapsed;
   end: GameElapsed;
};

export type StrengthPiece = {
   start: GameElapsed;
   end: GameElapsed;
   period: number;
   strength: Strength;
   baseline: number;
};

export type ShootoutAttempt = {
   side: Side;
   goal: boolean;
};

export type Shootout = {
   start: number;
   attemptWidth: number;
   attempts: ShootoutAttempt[];
};

// Positions are fractions of the full width: the timed game, then the shootout if there was one.
export type GameAxis = {
   periods: PeriodSpan[];
   pieces: StrengthPiece[];
   breakpoints: GameElapsed[];
   positions: number[];
   shootout?: Shootout;
};

export function periodSpans(plays: Play[]): PeriodSpan[] {
   const spans: PeriodSpan[] = [];
   for (const play of plays) {
      if (play.periodDescriptor.periodType === PERIOD_TYPES.SHOOTOUT) continue;
      const period = play.periodDescriptor.number;
      const time = playTime(play);
      if (play.typeDescKey === PLAY_TYPES.PERIOD_START)
         spans.push({ period, start: time, end: time });
      if (play.typeDescKey === PLAY_TYPES.PERIOD_END) {
         const span = spans.find((candidate) => candidate.period === period);
         if (span !== undefined) span.end = time;
      }
   }
   return spans;
}

const baselineSkaters = (game: Game, period: number): number =>
   isThreeOnThreeOvertime(game, period) ? 3 : 5;

export const isBaseline = ({ strength, baseline }: StrengthPiece): boolean =>
   strength.away === baseline && strength.home === baseline;

export function strengthPieces(
   game: Game,
   timeline: TimelineEntry[],
   periods: PeriodSpan[],
): StrengthPiece[] {
   const changes = timeline.filter((entry) => entry.kind === 'strength').map(({ time }) => time);
   const pieces: StrengthPiece[] = [];
   for (const { period, start, end } of periods) {
      const cuts = [...new Set([start, ...changes.filter((t) => t > start && t < end), end])];
      for (let i = 0; i < cuts.length - 1; i++) {
         const strength = strengthAt(timeline, cuts[i]);
         const last = pieces.at(-1);
         if (
            last !== undefined
            && last.period === period
            && last.strength.away === strength.away
            && last.strength.home === strength.home
         ) {
            last.end = cuts[i + 1];
         } else {
            pieces.push({
               start: cuts[i],
               end: cuts[i + 1],
               period,
               strength,
               baseline: baselineSkaters(game, period),
            });
         }
      }
   }
   return pieces;
}

export const shootoutAttempts = ({ plays, sideOf }: GameIndex): ShootoutAttempt[] =>
   plays.flatMap((play) =>
      play.periodDescriptor.periodType === PERIOD_TYPES.SHOOTOUT
      && SHOOTOUT_SHOTS.includes(play.typeDescKey)
      && play.details?.eventOwnerTeamId !== undefined
         ? [{ side: sideOf(play.details.eventOwnerTeamId), goal: isGoal(play) }]
         : [],
   );

export function compressedAxis(
   periods: PeriodSpan[],
   pieces: StrengthPiece[],
   attempts: ShootoutAttempt[],
): GameAxis {
   const shootoutWidth =
      attempts.length > 0 ? SHOOTOUT_GAP + attempts.length * SHOOTOUT_ATTEMPT : 0;
   const timedWidth = 1 - shootoutWidth;
   const baseline = pieces.filter(isBaseline);
   const special = pieces.filter((piece) => !isBaseline(piece));
   const length = (list: StrengthPiece[]) =>
      list.reduce((sum, { start, end }) => sum + end - start, 0);
   const baselineLength = length(baseline);
   const specialLength = length(special);

   const baselineWidth =
      specialLength === 0 ? timedWidth : baseline.length > 0 ? timedWidth * BASELINE_SHARE : 0;
   const flexWidth = Math.max(0, baselineWidth - MIN_BASELINE * baseline.length);
   const width = (piece: StrengthPiece): number => {
      const pieceLength = piece.end - piece.start;
      if (isBaseline(piece)) {
         return baselineLength === 0
            ? 0
            : MIN_BASELINE + (flexWidth * pieceLength) / baselineLength;
      }
      return ((timedWidth - baselineWidth) * pieceLength) / specialLength;
   };

   const breakpoints = pieces.length > 0 ? [pieces[0].start] : [];
   const positions = pieces.length > 0 ? [0] : [];
   for (const piece of pieces) {
      breakpoints.push(piece.end);
      positions.push((positions.at(-1) ?? 0) + width(piece));
   }

   const axis: GameAxis = { periods, pieces, breakpoints, positions };
   if (attempts.length > 0) {
      axis.shootout = {
         start: timedWidth + SHOOTOUT_GAP,
         attemptWidth: SHOOTOUT_ATTEMPT,
         attempts,
      };
   }
   return axis;
}

export function gameAxis(index: GameIndex, timeline: TimelineEntry[]): GameAxis {
   const periods = periodSpans(index.plays);
   return compressedAxis(
      periods,
      strengthPieces(index.game, timeline, periods),
      shootoutAttempts(index),
   );
}

export function axisX({ breakpoints, positions }: GameAxis, time: GameElapsed): number {
   const i = lastIndexWhere(breakpoints, (breakpoint) => breakpoint <= time);
   if (i === -1) return 0;
   if (i === breakpoints.length - 1) return positions[i];
   const span = breakpoints[i + 1] - breakpoints[i];
   return positions[i] + ((time - breakpoints[i]) / span) * (positions[i + 1] - positions[i]);
}
