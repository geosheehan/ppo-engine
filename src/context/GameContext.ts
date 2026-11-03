import { createContext } from 'react';
import type { GameIndex } from '@domain/game';

export const GameContext = createContext<GameIndex | null>(null);
