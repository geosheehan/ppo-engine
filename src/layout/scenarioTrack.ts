import { PERIOD_SECONDS } from '@domain/constants';
import { penaltySeconds, SCENARIO_GAME_TYPES } from '@domain/scenario';
import type { ScenarioEvent, ScenarioGameType, ScenarioPenalty } from '@domain/scenario';
import type { GameElapsed, Side } from '@domain/types';

const TICK_STEPS = [5 * 60, 10 * 60, PERIOD_SECONDS];
const MIN_TICK_GAP_PX = 48;

export const OVERTIME_FORMATS: Record<
   ScenarioGameType,
   { chip: string; length: string; title: string }
> = {
   [SCENARIO_GAME_TYPES.REGULAR]: {
      chip: '3v3',
      length: '5:00',
      title: 'Regular-season OT: 3-on-3 for 5:00',
   },
   [SCENARIO_GAME_TYPES.PLAYOFF]: {
      chip: '5v5',
      length: '20:00',
      title: 'Playoff OT: 5-on-5 for 20:00',
   },
};

export const trackFraction = (time: GameElapsed, total: GameElapsed): number => time / total;

export const trackSeconds = (fraction: number, total: GameElapsed): number => fraction * total;

export const tickSeconds = (trackWidth: number, total: GameElapsed): number =>
   TICK_STEPS.find((step) => trackFraction(step, total) * trackWidth >= MIN_TICK_GAP_PX)
   ?? PERIOD_SECONDS;

export const trackTicks = (total: GameElapsed, step: number = TICK_STEPS[0]): GameElapsed[] => {
   const ticks = Array.from({ length: Math.floor(total / step) + 1 }, (_, i) => i * step);
   return ticks.at(-1) === total ? ticks : [...ticks, total];
};

export const isPeriodStart = (time: GameElapsed, total: GameElapsed): boolean =>
   time < total && time % PERIOD_SECONDS === 0;

export type TrackLanes = {
   laneOf: Map<number, number>;
   laneCount: Record<Side, number>;
};

// Puts each penalty in the first lane of its team where it doesn't overlap the penalty before it,
// drawn at its full called length. Every team keeps at least one lane so there is somewhere to drop.
export function penaltyLanes(events: ScenarioEvent[]): TrackLanes {
   const laneOf = new Map<number, number>();
   const laneEnds: Record<Side, GameElapsed[]> = { away: [], home: [] };
   const penalties = events
      .filter((event): event is ScenarioPenalty => event.kind === 'penalty')
      .toSorted((a, b) => a.time - b.time || a.id - b.id);
   for (const penalty of penalties) {
      const ends = laneEnds[penalty.side];
      let lane = ends.findIndex((end) => end <= penalty.time);
      if (lane === -1) lane = ends.length;
      ends[lane] = penalty.time + penaltySeconds(penalty.penaltyType);
      laneOf.set(penalty.id, lane);
   }
   return {
      laneOf,
      laneCount: {
         away: Math.max(1, laneEnds.away.length),
         home: Math.max(1, laneEnds.home.length),
      },
   };
}
