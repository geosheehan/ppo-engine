import { use } from 'react';
import { ReplayPositionContext, SelectedGameContext } from '@context/SelectedGameContext';
import type { ReplayPositionValue, SelectedGameValue } from '@context/SelectedGameContext';

export function useSelectedGame(): SelectedGameValue {
   const context = use(SelectedGameContext);
   if (!context) throw new Error('useSelectedGame must be used within a SelectedGameProvider');
   return context;
}

export function useReplayPosition(): ReplayPositionValue {
   const context = use(ReplayPositionContext);
   if (!context) throw new Error('useReplayPosition must be used within a SelectedGameProvider');
   return context;
}
