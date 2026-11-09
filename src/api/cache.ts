import type { GamePpo, GameSummary, PpoApi } from '@api/types';
import type { ScheduleWeek } from '@domain/types';

export type CachedPpoApi = PpoApi & {
   forgetGamePpo: (id: string) => void;
   forgetSchedule: (weekStart: string) => void;
};

function remember<T>(cache: Map<string, Promise<T>>, key: string, load: () => Promise<T>) {
   let value = cache.get(key);
   if (value === undefined) {
      value = load();
      cache.set(key, value);
   }
   return value;
}

export function withCache(api: PpoApi): CachedPpoApi {
   let games: Promise<GameSummary[]> | undefined;
   const gamePpos = new Map<string, Promise<GamePpo>>();
   const schedules = new Map<string, Promise<ScheduleWeek>>();
   return {
      listGames: () => (games ??= api.listGames()),
      getGamePpo: (id) => remember(gamePpos, id, () => api.getGamePpo(id)),
      getSchedule: (weekStart) => remember(schedules, weekStart, () => api.getSchedule(weekStart)),
      forgetGamePpo: (id) => {
         gamePpos.delete(id);
      },
      forgetSchedule: (weekStart) => {
         schedules.delete(weekStart);
      },
   };
}
