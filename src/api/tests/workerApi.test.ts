import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildGamePpo } from '@api/gamePpo';
import type { GamePpo } from '@api/types';
import { createWorkerApi } from '@api/workerApi';

vi.mock('@api/gamePpo', () => ({
   buildGamePpo: vi.fn(() => Promise.resolve({} as GamePpo)),
}));

const api = createWorkerApi('https://worker.test');

const respond = (body: string, status = 200) =>
   vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status }));

afterEach(() => {
   vi.restoreAllMocks();
});

describe('workerApi.listGames', () => {
   it('lists the default games by NHL ID, newest first', async () => {
      const games = await api.listGames();
      expect(games.length).toBeGreaterThan(0);
      for (const game of games) expect(game.id).toMatch(/^\d{4}0[123]\d{4}$/);
      const dates = games.map((game) => game.date);
      expect(dates).toEqual(dates.toSorted().reverse());
   });
});

describe('workerApi.getGamePpo', () => {
   it('asks the Worker for the game and runs the engine on its game and shifts', async () => {
      const fetch = respond('{"game":{"id":2026020046},"shifts":{"data":[{"id":1}],"total":1}}');
      await api.getGamePpo('2026020046');
      expect(fetch).toHaveBeenCalledWith('https://worker.test/game/2026020046');
      expect(buildGamePpo).toHaveBeenCalledWith({ id: 2026020046 }, [{ id: 1 }]);
   });

   it("rejects with the Worker's error message", async () => {
      respond('{"error":"Game 2026020046 has not finished"}', 409);
      await expect(api.getGamePpo('2026020046')).rejects.toThrow(
         'Game 2026020046 has not finished',
      );
   });

   it('falls back to the status when the error is not JSON', async () => {
      respond('Bad gateway', 502);
      await expect(api.getGamePpo('2026020046')).rejects.toThrow('The game server answered 502');
   });
});

describe('workerApi.getSchedule', () => {
   it('asks the Worker for the week', async () => {
      const fetch = respond('{"weekStart":"2026-11-02","days":[]}');
      await expect(api.getSchedule('2026-11-02')).resolves.toEqual({
         weekStart: '2026-11-02',
         days: [],
      });
      expect(fetch).toHaveBeenCalledWith('https://worker.test/schedule/2026-11-02');
   });

   it("rejects with the Worker's error message", async () => {
      respond('{"error":"Too many new NHL requests right now, try again in a minute"}', 503);
      await expect(api.getSchedule('2026-11-02')).rejects.toThrow('Too many new NHL requests');
   });
});
