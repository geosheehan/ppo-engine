import type { PenaltyEngineResult, PowerPlayCount } from '@engine/types';
import type { GameIndex, HomeTeamDefendingSide } from '@domain/types';

export type GameContextValue = GameIndex & {
   penaltyResult: PenaltyEngineResult;
   powerPlays: PowerPlayCount;
   defendingSides: Map<number, HomeTeamDefendingSide>;
};
