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
