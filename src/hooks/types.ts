import type { useReplay } from '@hooks/useReplay';

export type Replay = ReturnType<typeof useReplay>;

export type Playback = { label: string } & (
   | {
        mode: 'live';
        speed: number;
     }
   | {
        mode: 'length';
        minutes: number;
     }
);
