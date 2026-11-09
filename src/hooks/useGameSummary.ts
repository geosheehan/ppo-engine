import { useEffect, useState } from 'react';
import { ppoApi } from '@api/ppoApi';
import type { GameSummary } from '@api/types';

// Shares the game's cached load with the game page, so it adds no request.
export function useGameSummary(gameId: string | undefined): GameSummary | undefined {
   const [summary, setSummary] = useState<GameSummary>();

   useEffect(() => {
      if (gameId === undefined) return undefined;
      let current = true;
      ppoApi.getGamePpo(gameId).then(
         ({ game }) => {
            if (!current) return;
            setSummary({
               id: gameId,
               date: game.gameDate,
               away: game.awayTeam.abbrev,
               home: game.homeTeam.abbrev,
            });
         },
         () => undefined,
      );
      return () => {
         current = false;
      };
   }, [gameId]);

   return summary?.id === gameId ? summary : undefined;
}
