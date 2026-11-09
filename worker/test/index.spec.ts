import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

const get = (path: string, init?: RequestInit) => SELF.fetch(`https://example.com${path}`, init);

describe('GET /game/:id', () => {
   it('accepts a regular season game', async () => {
      const response = await get('/game/2026020046');
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id: '2026020046' });
   });

   it.each(['2026010046', '2025030411'])('accepts preseason and playoff game %s', async (id) => {
      expect((await get(`/game/${id}`)).status).toBe(200);
   });

   it.each(['abc', '202602004', '20260200466', '2026000046', '2026040001'])(
      'rejects game ID %s',
      async (id) => {
         expect((await get(`/game/${id}`)).status).toBe(400);
      },
   );

   it.each(['/', '/game', '/game/', '/game/2026020046/extra', '/games/2026020046'])(
      'has nothing at %s',
      async (path) => {
         expect((await get(path)).status).toBe(404);
      },
   );

   it('only allows GET', async () => {
      const response = await get('/game/2026020046', { method: 'POST' });
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET');
   });
});
