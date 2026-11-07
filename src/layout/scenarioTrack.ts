import { PERIOD_SECONDS } from '@domain/constants';
import { penaltySeconds, SCENARIO_SECONDS } from '@domain/scenario';
import type { ScenarioEvent, ScenarioPenalty } from '@domain/scenario';
import type { GameElapsed, Side } from '@domain/types';

const TICK_SECONDS = 5 * 60;

export const trackFraction = (time: GameElapsed): number => time / SCENARIO_SECONDS;

export const trackSeconds = (fraction: number): number => fraction * SCENARIO_SECONDS;

export const trackTicks = (): GameElapsed[] =>
   Array.from({ length: SCENARIO_SECONDS / TICK_SECONDS + 1 }, (_, i) => i * TICK_SECONDS);

export const isPeriodBreak = (time: GameElapsed): boolean =>
   time > 0 && time < SCENARIO_SECONDS && time % PERIOD_SECONDS === 0;

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
