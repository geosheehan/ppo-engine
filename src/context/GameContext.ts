import { createContext } from 'react';
import type { GameIndex } from '@domain/game';
import type { HomeTeamDefendingSide } from '@domain/types';
import type { PowerPlayCount } from '@engine/powerPlayCounter';
import type { PenaltyEngineResult } from '@engine/types';

export type GameContextValue = GameIndex & {
   penaltyResult: PenaltyEngineResult;
   powerPlays: PowerPlayCount;
   defendingSides: Map<number, HomeTeamDefendingSide>;
};

export const GameContext = createContext<GameContextValue | null>(null);
