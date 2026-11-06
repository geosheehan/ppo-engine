import type { ServedPenalty } from '@engine/types';
import { secondsToClock } from '@domain/clock';
import { PERIOD_SECONDS } from '@domain/constants';
import type { GameElapsed } from '@domain/types';

// The axis breakpoints plus every moment a penalty starts or ends, in game order and within the game.
export function chartMoments(served: ServedPenalty[], breakpoints: GameElapsed[]): GameElapsed[] {
   const gameEnd = breakpoints.at(-1) ?? 0;
   return [...new Set([...breakpoints, ...served.flatMap(({ start, end }) => [start, end])])]
      .filter((time) => time <= gameEnd)
      .toSorted((a, b) => a - b);
}

// A moment on a period boundary belongs to the period before it, so a penalty that runs out the period ends at
// 20:00 rather than at 0:00 of the next.
export const momentPeriod = (time: GameElapsed): number =>
   Math.max(1, Math.ceil(time / PERIOD_SECONDS));

export const momentClock = (time: GameElapsed): string =>
   secondsToClock(time - (momentPeriod(time) - 1) * PERIOD_SECONDS);
