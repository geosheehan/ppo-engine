import type { ServedPenalty } from '@engine/types';
import { secondsToClock } from '@domain/clock';
import { PERIOD_SECONDS } from '@domain/constants';
import type { GameElapsed } from '@domain/types';

// The moments a penalty starts or ends, in game order. The chart spaces them evenly rather than by time.
export const chartMoments = (served: ServedPenalty[]): GameElapsed[] =>
   [...new Set(served.flatMap(({ start, end }) => [start, end]))].toSorted((a, b) => a - b);

// A moment on a period boundary belongs to the period before it, so a penalty that runs out the period ends at
// 20:00 rather than at 0:00 of the next.
export const momentPeriod = (time: GameElapsed): number =>
   Math.max(1, Math.ceil(time / PERIOD_SECONDS));

export const momentClock = (time: GameElapsed): string =>
   secondsToClock(time - (momentPeriod(time) - 1) * PERIOD_SECONDS);
