import { isGoal, playTime } from '@domain/plays';
import type { Play, ReplayPosition } from '@domain/types';

export function livePosition(
   plays: Play[],
   start: ReplayPosition,
   elapsedMs: number,
   speed: number,
   holds: { goalMs: number; sameSecondMs: number },
): ReplayPosition {
   let { index, time } = start;
   let left = elapsedMs;

   while (index < plays.length - 1) {
      const playAt = playTime(plays[index]);
      const nextAt = playTime(plays[index + 1]);

      if (time === playAt) {
         let hold = 0;
         if (isGoal(plays[index])) hold = holds.goalMs;
         else if (nextAt === playAt) hold = holds.sameSecondMs / speed;
         if (left < hold) return { index, time };
         left -= hold;
      }

      const travelMs = ((nextAt - time) * 1000) / speed;
      // The tolerance stops float leftovers (1.9999… game seconds) from showing the clock a second behind.
      if (left < travelMs) return { index, time: time + Math.floor((left * speed) / 1000 + 1e-6) };
      left -= travelMs;
      index += 1;
      time = nextAt;
   }

   return { index, time };
}
