import { createContext } from 'react';
import type { ReplayPosition } from '@domain/types';

export type SelectedGameValue = {
   gameId?: string;
   selectGame: (gameId: string) => void;
};

export type ReplayPositionValue = {
   position?: ReplayPosition;
   setPosition: (position: ReplayPosition) => void;
};

export const SelectedGameContext = createContext<SelectedGameValue | null>(null);

// Separate from the selected game so live playback ticks don't re-render the nav.
export const ReplayPositionContext = createContext<ReplayPositionValue | null>(null);
