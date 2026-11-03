import { createContext } from 'react';
import type { GameIndex } from '@domain/game';
import type { HomeTeamDefendingSide } from '@domain/types';
import type { PenaltyEngineResult } from '@engine/types';

export type GameContextValue = GameIndex & {
   penaltyResult: PenaltyEngineResult;
   defendingSides: Map<number, HomeTeamDefendingSide>;
};

export const GameContext = createContext<GameContextValue | null>(null);
