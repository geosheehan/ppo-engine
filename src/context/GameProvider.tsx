import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { GameContext } from '@context/GameContext';
import { indexGame } from '@domain/game';
import type { Game, Shift } from '@domain/types';

function GameProvider({ game, shifts, children }: { game: Game; shifts?: Shift[]; children: ReactNode }) {
   const value = useMemo(() => indexGame(game, shifts), [game, shifts]);
   return <GameContext value={value}>{children}</GameContext>;
}

export default GameProvider;
