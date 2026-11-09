import defaultGames from '@api/defaultGames.json';
import { buildGamePpo } from '@api/gamePpo';
import type { GameSummary, PpoApi } from '@api/types';
import type { Game, ShiftChart } from '@domain/types';

type WorkerGame = { game: Game; shifts: ShiftChart };

const games: GameSummary[] = defaultGames;

async function errorMessage(response: Response): Promise<string> {
   try {
      const body: unknown = await response.json();
      if (typeof body === 'object' && body !== null && 'error' in body) {
         if (typeof body.error === 'string') return body.error;
      }
   } catch {
      // Not JSON, so fall back to the status.
   }
   return `The game server answered ${response.status}`;
}

export function createWorkerApi(baseUrl: string): PpoApi {
   return {
      listGames: () => Promise.resolve(games.toSorted((a, b) => b.date.localeCompare(a.date))),

      async getGamePpo(id) {
         const response = await fetch(`${baseUrl}/game/${encodeURIComponent(id)}`);
         if (!response.ok) throw new Error(await errorMessage(response));
         const { game, shifts } = (await response.json()) as WorkerGame;
         return buildGamePpo(game, shifts.data);
      },
   };
}
