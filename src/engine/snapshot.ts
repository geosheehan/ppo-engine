import type { PenaltyPlay } from '@domain/types';
import { playTime } from '@engine/penaltyEngine';
import type { PenaltyEngineResult, ServedPenalty, Strength } from '@engine/types';

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

function remainingAt(served: ServedPenalty, play: PenaltyPlay, time: number): number {
   if (served.doubleMinorHalf) {
      const halfLeft = served.start + 120 - time;
      return served.doubleMinorHalf === 1 ? halfLeft + 120 : halfLeft;
   }
   return served.start + play.details.duration * 60 - time;
}

export function snapshotAt(result: PenaltyEngineResult, penaltyPlays: Map<number, PenaltyPlay>, time: number): Snapshot {
   const strInterval = result.strengthIntervals.find((s) => s.start <= time && time < s.end);
   const strength = strInterval ? { away: strInterval.away, home: strInterval.home } : { away: 5, home: 5 };

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
