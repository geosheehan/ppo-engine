import { use } from 'react';
import { GameContext } from '@context/GameContext';
import type { GameIndex } from '@domain/game';

export function useGame(): GameIndex {
   const context = use(GameContext);
   if (!context) throw new Error('useGame must be used within a GameProvider');
   return context;
}
