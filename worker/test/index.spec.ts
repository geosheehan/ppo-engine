import { exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

let visitors = 0;
// A fresh visitor per request unless a test sets one, so only the rate limit tests hit the limit.
const get = (path: string, init?: RequestInit) => {
   const headers = new Headers(init?.headers);
   if (!headers.has('CF-Connecting-IP')) {
      headers.set('CF-Connecting-IP', `198.51.100.${++visitors % 256}`);
   }
   return exports.default.fetch(`https://example.com${path}`, { ...init, headers });
};

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

describe('per-visitor rate limit', () => {
   const from = (ip: string, path = '/game/2026020046') =>
      get(path, { headers: { 'CF-Connecting-IP': ip } });

   it('allows 30 requests a minute, then answers 429', async () => {
      for (let i = 0; i < 30; i++) expect((await from('203.0.113.1')).status).toBe(200);

      const blocked = await from('203.0.113.1');
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get('Retry-After')).toBe('60');
   });

   it('counts bad requests too', async () => {
      for (let i = 0; i < 30; i++) await from('203.0.113.2', '/game/abc');
      expect((await from('203.0.113.2')).status).toBe(429);
   });

   it('limits each visitor separately', async () => {
      for (let i = 0; i < 31; i++) await from('203.0.113.3');
      expect((await from('203.0.113.4')).status).toBe(200);
   });
});
