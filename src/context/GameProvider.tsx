import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { GameContext } from '@context/GameContext';
import { indexGame } from '@domain/game';
import type { Game, Shift } from '@domain/types';
import { homeDefendingSides } from '@engine/defendingSide';
import { runPenaltyEngine } from '@engine/penaltyEngine';

function GameProvider({ game, shifts, children }: { game: Game; shifts?: Shift[]; children: ReactNode }) {
   const value = useMemo(() => {
      const index = indexGame(game, shifts);
      return { ...index, penaltyResult: runPenaltyEngine(index), defendingSides: homeDefendingSides(game) };
   }, [game, shifts]);
   return <GameContext value={value}>{children}</GameContext>;
}

export default GameProvider;
