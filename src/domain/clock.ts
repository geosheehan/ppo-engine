export const PERIOD_SECONDS = 20 * 60;

export const clockToSeconds = (clock: string): number => {
   const [mins, secs] = clock.split(':').map(Number);
   return (mins * 60) + secs;
};

export const gameSeconds = (period: number, clock: string): number => {
   return (period - 1) * PERIOD_SECONDS + clockToSeconds(clock);
};

export const secondsToClock = (seconds: number): string => {
   return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};
