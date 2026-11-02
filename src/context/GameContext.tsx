import type { ReactNode } from 'react';
import { createContext, useMemo, use } from 'react';
import type { GameIndex } from '@domain/game';
import { indexGame } from '@domain/game';
import type { Game, Shift } from '@domain/types';

const GameContext = createContext<GameIndex | null>(null);

export function GameProvider({ game, shifts, children }: { game: Game; shifts?: Shift[]; children: ReactNode }) {
   const value = useMemo(() => indexGame(game, shifts), [game, shifts]);
   return <GameContext value={value}>{children}</GameContext>;
};

export function useGame() {
   const context = use(GameContext);
   if (!context) throw new Error('useGame must be used within a GameProvider');
   return context;
};
