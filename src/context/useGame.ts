import { use } from 'react';
import { GameContext } from '@context/GameContext';
import type { GameContextValue } from '@context/types';

export function useGame(): GameContextValue {
   const context = use(GameContext);
   if (!context) throw new Error('useGame must be used within a GameProvider');
   return context;
}
