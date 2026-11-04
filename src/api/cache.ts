import type { GamePpo, GameSummary, PpoApi } from '@api/types';

// React's use() needs the same promise on every render, so each request is made once and kept.
export function withCache(api: PpoApi): PpoApi {
   let games: Promise<GameSummary[]> | undefined;
   const gamePpos = new Map<string, Promise<GamePpo>>();
   return {
      listGames: () => (games ??= api.listGames()),
      getGamePpo: (id) => {
         let gamePpo = gamePpos.get(id);
         if (gamePpo === undefined) {
            gamePpo = api.getGamePpo(id);
            gamePpos.set(id, gamePpo);
         }
         return gamePpo;
      },
   };
}
