import type { ReactNode } from 'react';
import { use, useMemo } from 'react';
import { GameContext } from '@context/GameContext';
import { ppoApi } from '@api/ppoApi';
import { homeDefendingSides } from '@engine/defendingSide';
import { indexGame } from '@domain/game';

type GameProviderProps = {
   gameId: string;
   children: ReactNode;
};

function GameProvider({ gameId, children }: GameProviderProps) {
   const { game, shifts, penaltyResult, powerPlays } = use(ppoApi.getGamePpo(gameId));
   const value = useMemo(
      () => ({
         ...indexGame(game, shifts),
         penaltyResult,
         powerPlays,
         defendingSides: homeDefendingSides(game),
      }),
      [game, shifts, penaltyResult, powerPlays],
   );
   return <GameContext value={value}>{children}</GameContext>;
}

export default GameProvider;
