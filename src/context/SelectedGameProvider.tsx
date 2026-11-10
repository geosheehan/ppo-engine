import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useMatch } from 'react-router';
import { ReplayPositionContext, SelectedGameContext } from '@context/SelectedGameContext';
import { GAME_VIEW_PATTERN } from '@layout/routes';
import type { ReplayPosition } from '@domain/types';

type Selection = {
   gameId?: string;
   position?: ReplayPosition;
};

type SelectedGameProviderProps = {
   children: ReactNode;
};

// Lives above the routes, so the game and the replay spot outlast every page change.
function SelectedGameProvider({ children }: SelectedGameProviderProps) {
   const urlGameId = useMatch(GAME_VIEW_PATTERN)?.params.gameId;
   const [selection, setSelection] = useState<Selection>({});

   if (urlGameId !== undefined && urlGameId !== selection.gameId) {
      setSelection({ gameId: urlGameId });
   }

   const selectGame = useCallback(
      (gameId: string) =>
         setSelection((current) => (current.gameId === gameId ? current : { gameId })),
      [],
   );
   // Stable, because playback effects depend on it.
   const setPosition = useCallback(
      (position: ReplayPosition) => setSelection((current) => ({ ...current, position })),
      [],
   );

   const game = useMemo(
      () => ({ gameId: selection.gameId, selectGame }),
      [selection.gameId, selectGame],
   );
   const replay = useMemo(
      () => ({ position: selection.position, setPosition }),
      [selection.position, setPosition],
   );

   return (
      <SelectedGameContext value={game}>
         <ReplayPositionContext value={replay}>{children}</ReplayPositionContext>
      </SelectedGameContext>
   );
}

export default SelectedGameProvider;
