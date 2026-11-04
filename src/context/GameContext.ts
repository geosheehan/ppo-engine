import { createContext } from 'react';
import type { GameContextValue } from '@context/types';

export const GameContext = createContext<GameContextValue | null>(null);
