import type { GamePpo, GameSummary, PpoApi } from '@api/types';

export type CachedPpoApi = PpoApi & { forgetGamePpo: (id: string) => void };

export function withCache(api: PpoApi): CachedPpoApi {
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
      forgetGamePpo: (id) => {
         gamePpos.delete(id);
      },
   };
}
