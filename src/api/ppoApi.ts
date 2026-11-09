import { withCache } from '@api/cache';
import type { PpoApi } from '@api/types';
import { createWorkerApi } from '@api/workerApi';

async function loadApi(): Promise<PpoApi> {
   if (import.meta.env.VITE_GAME_SOURCE === 'local') {
      return (await import('@api/localApi')).localApi;
   }
   const workerUrl = import.meta.env.VITE_WORKER_URL;
   if (workerUrl === undefined) throw new Error('VITE_WORKER_URL is not set');
   return createWorkerApi(workerUrl);
}

export const ppoApi = withCache({
   listGames: async () => (await loadApi()).listGames(),
   getGamePpo: async (id) => (await loadApi()).getGamePpo(id),
   getSchedule: async (weekStart) => (await loadApi()).getSchedule(weekStart),
});
