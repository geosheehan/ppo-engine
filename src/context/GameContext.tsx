import type { ReactNode } from 'react';
import { createContext, useMemo, use } from 'react';
import type { GameIndex } from '@domain/game';
import { indexGame } from '@domain/game';
import type { Game } from '@domain/types';

const GameContext = createContext<GameIndex | null>(null);

export function GameProvider({ game, children }: { game: Game; children: ReactNode }) {
    const value = useMemo(() => indexGame(game), [game]);
    return <GameContext value={value}>{children}</GameContext>;
};

export function useGame() {
    const context = use(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
};
