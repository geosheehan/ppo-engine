import type { Playback } from '@hooks/types';

// Icon width on the rink, in feet.
export const MARKER_SIZE = 5;

export const PLAYBACKS: Record<string, Playback> = {
   'live-1': { mode: 'live', speed: 1, label: 'x1' },
   'live-3': { mode: 'live', speed: 3, label: 'x3' },
   'live-6': { mode: 'live', speed: 6, label: 'x6' },
   'length-10': { mode: 'length', minutes: 10, label: '10 min' },
   'length-7': { mode: 'length', minutes: 7, label: '7 min' },
   'length-5': { mode: 'length', minutes: 5, label: '5 min' },
};
