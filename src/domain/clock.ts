import { PERIOD_SECONDS } from '@domain/constants';
import type { GameElapsed } from '@domain/types';

export const clockToSeconds = (clock: string): number => {
   const [mins, secs] = clock.split(':').map(Number);
   return mins * 60 + secs;
};

export const gameSeconds = (period: number, clock: string): GameElapsed => {
   return (period - 1) * PERIOD_SECONDS + clockToSeconds(clock);
};

export const secondsToClock = (seconds: number): string => {
   return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};
