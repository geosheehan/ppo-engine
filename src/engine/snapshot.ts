import type { PenaltyEngineResult, ServedPenalty, Strength, StrengthInterval } from '@engine/types';
import { playTime } from '@domain/plays';
import { lastIndexWhere } from '@domain/search';
import type { GameElapsed, PenaltyPlay } from '@domain/types';

export type ClockedPenalty = {
   served: ServedPenalty;
   play: PenaltyPlay;
   remaining: number;
};

export type QueuedPenalty = {
   served: ServedPenalty;
   play: PenaltyPlay;
};

export type Snapshot = {
   strength: Strength;
   onClock: ClockedPenalty[];
   queued: QueuedPenalty[];
};

function remainingAt(served: ServedPenalty, play: PenaltyPlay, time: GameElapsed): number {
   if (served.doubleMinorHalf) {
      const halfLeft = served.start + 120 - time;
      return served.doubleMinorHalf === 1 ? halfLeft + 120 : halfLeft;
   }
   return served.start + play.details.duration * 60 - time;
}

function intervalAt(
   intervals: StrengthInterval[],
   time: GameElapsed,
): StrengthInterval | undefined {
   const interval = intervals[lastIndexWhere(intervals, ({ start }) => start <= time)];
   return interval && time < interval.end ? interval : undefined;
}

export function snapshotAt(
   result: PenaltyEngineResult,
   penaltyPlays: Map<number, PenaltyPlay>,
   time: GameElapsed,
): Snapshot {
   const interval = intervalAt(result.strengthIntervals, time);
   const strength = interval ? { away: interval.away, home: interval.home } : { away: 5, home: 5 };

   const onClock: ClockedPenalty[] = [];
   const queued: QueuedPenalty[] = [];
   for (const served of result.servedPenalties) {
      const play = penaltyPlays.get(served.penaltyEventId);
      if (!play) continue;

      if (served.start <= time && time < served.end) {
         onClock.push({ served, play, remaining: remainingAt(served, play, time) });
      } else if (served.doubleMinorHalf !== 2 && playTime(play) <= time && time < served.start) {
         // The second half of a double minor isn't queued; it's waiting behind its own first half.
         queued.push({ served, play });
      }
   }

   return { strength, onClock, queued };
}
