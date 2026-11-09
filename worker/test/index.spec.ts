import { env, exports } from 'cloudflare:workers';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';

const STORED = ['2026020046', '2026010046', '2025030411'];
const storedBody = (id: string) => `{"game":{"id":${id}},"shifts":{"data":[],"total":0}}`;

beforeAll(async () => {
   await Promise.all(STORED.map((id) => env.GAMES.put(`v1:${id}`, storedBody(id))));
});

type NhlRoutes = Partial<
   Record<'playByPlay' | 'shifts' | 'schedule', () => Response | Promise<Response>>
>;
let nhlRoutes: NhlRoutes = {};
const nhlRequests: Request[] = [];

beforeEach(() => {
   nhlRoutes = {};
   nhlRequests.length = 0;
   vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const request = new Request(input, init);
      nhlRequests.push(request);
      const route = request.url.includes('/play-by-play')
         ? nhlRoutes.playByPlay
         : request.url.includes('/shiftcharts')
           ? nhlRoutes.shifts
           : request.url.includes('/schedule/')
             ? nhlRoutes.schedule
             : undefined;
      if (route === undefined) throw new Error(`Unexpected request: ${request.url}`);
      return route();
   });
});

afterEach(() => {
   vi.restoreAllMocks();
});

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
   it.each(STORED)('returns stored game %s exactly as stored', async (id) => {
      const response = await get(`/game/${id}`);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400');
      expect(await response.text()).toBe(storedBody(id));
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
      expect(response.headers.get('Allow')).toBe('GET, OPTIONS');
   });
});

describe('CORS', () => {
   const fromOrigin = (origin: string, path = '/game/2026020046', method = 'GET') =>
      get(path, { method, headers: { Origin: origin } });

   it.each(['https://geosheehan.github.io', 'http://localhost:5173', 'http://localhost:4173'])(
      'lets %s read responses',
      async (origin) => {
         const response = await fromOrigin(origin);
         expect(response.status).toBe(200);
         expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin);
         expect(response.headers.get('Access-Control-Expose-Headers')).toBe('Retry-After');
         expect(response.headers.get('Vary')).toBe('Origin');
      },
   );

   it.each([
      'https://example.com',
      'https://geosheehan.github.io.evil.test',
      'http://localhost:3000',
   ])('gives %s no access', async (origin) => {
      const response = await fromOrigin(origin);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(response.headers.get('Vary')).toBe('Origin');
   });

   it('lets the app read error responses too', async () => {
      const response = await fromOrigin('https://geosheehan.github.io', '/game/abc');
      expect(response.status).toBe(400);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
         'https://geosheehan.github.io',
      );
   });

   it('answers a preflight without counting it against the visitor', async () => {
      const visitor = { 'CF-Connecting-IP': '203.0.113.50', 'Origin': 'http://localhost:5173' };
      for (let i = 0; i < 31; i++) {
         const response = await get('/game/2026020046', { method: 'OPTIONS', headers: visitor });
         expect(response.status).toBe(204);
         expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
         expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET');
      }
      expect((await get('/game/2026020046', { headers: visitor })).status).toBe(200);
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

describe('loading a game from the NHL', () => {
   const playByPlay = (id: string, gameState = 'OFF') =>
      `{"id":${id},"season":20262027,"gameState":"${gameState}","plays":[]}`;
   const shifts = (total: number) => `{"data":[${total > 0 ? '{"id":1}' : ''}],"total":${total}}`;
   const ok = (body: string) => () => new Response(body);

   let nhlCap: MockInstance<RateLimit['limit']>;
   beforeEach(() => {
      nhlCap = vi.spyOn(env.TO_NHL, 'limit').mockResolvedValue({ success: true });
   });

   it('fetches play-by-play then shifts, stores the pair, and serves it', async () => {
      nhlRoutes = { playByPlay: ok(playByPlay('2026020100')), shifts: ok(shifts(1)) };
      const expected = `{"game":${playByPlay('2026020100')},"shifts":${shifts(1)}}`;

      const response = await get('/game/2026020100');
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400');
      expect(await response.text()).toBe(expected);
      expect(JSON.parse(expected)).toBeTypeOf('object');
      expect(nhlRequests.map((request) => request.url)).toEqual([
         'https://api-web.nhle.com/v1/gamecenter/2026020100/play-by-play',
         'https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=2026020100',
      ]);
      expect(nhlRequests[0].headers.get('User-Agent')).toContain('ppo-engine');
      expect(await env.GAMES.get('v1:2026020100')).toBe(expected);
   });

   it('serves a stored game without asking the NHL', async () => {
      expect((await get('/game/2026020046')).status).toBe(200);
      expect(nhlRequests).toHaveLength(0);
   });

   it('accepts a game marked FINAL', async () => {
      nhlRoutes = { playByPlay: ok(playByPlay('2026020101', 'FINAL')), shifts: ok(shifts(1)) };
      expect((await get('/game/2026020101')).status).toBe(200);
   });

   it.each(['FUT', 'PRE', 'LIVE', 'CRIT'])(
      'refuses a %s game without asking for shifts',
      async (gameState) => {
         nhlRoutes = { playByPlay: ok(playByPlay('2026020102', gameState)) };
         const response = await get('/game/2026020102');
         expect(response.status).toBe(409);
         expect(await response.json()).toEqual({ error: 'Game 2026020102 has not finished' });
         expect(nhlRequests).toHaveLength(1);
         expect(await env.GAMES.get('v1:2026020102')).toBeNull();
      },
   );

   it.each([
      ['empty', shifts(0)],
      ['unrecognized', '{"rows":[],"count":0}'],
   ])('refuses %s shifts and stores nothing', async (_, body) => {
      nhlRoutes = { playByPlay: ok(playByPlay('2026020103')), shifts: ok(body) };
      const response = await get('/game/2026020103');
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({
         error: 'The NHL has no shifts for game 2026020103 yet',
      });
      expect(await env.GAMES.get('v1:2026020103')).toBeNull();
   });

   it('passes on a 404 from the NHL', async () => {
      nhlRoutes = { playByPlay: () => new Response('', { status: 404 }) };
      const response = await get('/game/2026029999');
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'The NHL has no such game' });
   });

   it('answers 502 when the NHL errors', async () => {
      nhlRoutes = { playByPlay: () => new Response('', { status: 500 }) };
      const response = await get('/game/2026020104');
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: 'The NHL answered 500' });
   });

   it('answers 502 when the NHL cannot be reached', async () => {
      nhlRoutes = {
         playByPlay: () => {
            throw new TypeError('network down');
         },
      };
      const response = await get('/game/2026020105');
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: 'The NHL did not answer' });
   });

   it('answers 503 without asking the NHL once the NHL cap is reached', async () => {
      nhlCap.mockResolvedValue({ success: false });
      const response = await get('/game/2026020106');
      expect(response.status).toBe(503);
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(nhlRequests).toHaveLength(0);
   });

   it('checks the NHL cap before each NHL request', async () => {
      nhlRoutes = { playByPlay: ok(playByPlay('2026020107')), shifts: ok(shifts(1)) };
      await get('/game/2026020107');
      expect(nhlCap).toHaveBeenCalledTimes(2);
      expect(nhlCap).toHaveBeenCalledWith({ key: 'nhl' });
   });

   describe('requests for the same game that arrive together', () => {
      const heldPlayByPlay = (body: () => Response) => {
         const { promise, resolve } = Promise.withResolvers<void>();
         return {
            route: async () => {
               await promise;
               return body();
            },
            release: resolve,
         };
      };

      it('share one NHL load', async () => {
         const held = heldPlayByPlay(ok(playByPlay('2026020108')));
         nhlRoutes = { playByPlay: held.route, shifts: ok(shifts(1)) };
         const first = get('/game/2026020108');
         const second = get('/game/2026020108');
         await vi.waitUntil(() => nhlRequests.length === 1);
         held.release();

         const responses = await Promise.all([first, second]);
         expect(responses.map((response) => response.status)).toEqual([200, 200]);
         const [firstBody, secondBody] = await Promise.all(responses.map((r) => r.text()));
         expect(secondBody).toBe(firstBody);
         expect(nhlRequests).toHaveLength(2);
      });

      it('share a failure, and a later request tries again', async () => {
         const held = heldPlayByPlay(() => new Response('', { status: 500 }));
         nhlRoutes = { playByPlay: held.route };
         const first = get('/game/2026020109');
         const second = get('/game/2026020109');
         await vi.waitUntil(() => nhlRequests.length === 1);
         held.release();

         const responses = await Promise.all([first, second]);
         expect(responses.map((response) => response.status)).toEqual([502, 502]);
         expect(nhlRequests).toHaveLength(1);

         nhlRoutes = { playByPlay: ok(playByPlay('2026020109')), shifts: ok(shifts(1)) };
         expect((await get('/game/2026020109')).status).toBe(200);
         expect(nhlRequests).toHaveLength(3);
      });
   });
});

describe('GET /schedule/:date', () => {
   const game = (id: number, gameState: string, startTimeUTC: string) => ({
      id,
      gameType: 2,
      gameState,
      gameScheduleState: 'OK',
      startTimeUTC,
      tvBroadcasts: [{ network: 'TV' }],
      awayTeam: { abbrev: 'AAA', score: 1, odds: [{ value: '+120' }] },
      homeTeam: { abbrev: 'BBB', score: 2, odds: [{ value: '-140' }] },
   });
   const nhlWeek = (games: unknown[]) =>
      JSON.stringify({
         previousStartDate: '2025-10-27',
         nextStartDate: '2025-11-10',
         oddsPartners: [{ name: 'Bookmaker' }],
         gameWeek: [{ date: '2025-11-03', games }],
      });
   const settledWeek = nhlWeek([game(2025020200, 'OFF', '2025-11-04T00:00:00Z')]);

   let scheduleNhlCap: MockInstance<RateLimit['limit']>;
   beforeEach(() => {
      scheduleNhlCap = vi.spyOn(env.TO_NHL, 'limit').mockResolvedValue({ success: true });
   });

   it('fetches the Monday of the week, trims it, stores it, and serves it', async () => {
      nhlRoutes = { schedule: () => new Response(settledWeek) };
      const response = await get('/schedule/2025-11-05');
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400');
      expect(nhlRequests.map((request) => request.url)).toEqual([
         'https://api-web.nhle.com/v1/schedule/2025-11-03',
      ]);
      const week = await response.json<Record<string, unknown>>();
      expect(week).toMatchObject({ weekStart: '2025-11-03', previousStartDate: '2025-10-27' });
      expect(JSON.stringify(week)).not.toMatch(/odds|Bookmaker|tvBroadcasts/);

      const stored = await env.GAMES.getWithMetadata('schedule:v1:2025-11-03');
      expect(stored.value).toBe(JSON.stringify(week));
   });

   it('serves any day of a stored week without asking the NHL', async () => {
      nhlRoutes = { schedule: () => new Response(settledWeek) };
      await get('/schedule/2025-11-03');
      nhlRequests.length = 0;
      const response = await get('/schedule/2025-11-09');
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ weekStart: '2025-11-03' });
      expect(nhlRequests).toHaveLength(0);
   });

   it('keeps a week with unfinished games for a short time', async () => {
      const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      nhlRoutes = { schedule: () => new Response(nhlWeek([game(2025020300, 'FUT', soon)])) };
      const response = await get('/schedule/2025-12-01');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
      const stored = await env.GAMES.getWithMetadata('schedule:v1:2025-12-01');
      expect(stored.metadata).toEqual({ lifetime: 300 });

      nhlRequests.length = 0;
      const again = await get('/schedule/2025-12-02');
      expect(again.headers.get('Cache-Control')).toBe('public, max-age=300');
      expect(nhlRequests).toHaveLength(0);
   });

   it.each(['2025-02-30', 'yesterday', '1900-01-01'])('answers 400 for %s', async (date) => {
      const response = await get(`/schedule/${date}`);
      expect(response.status).toBe(400);
      expect(nhlRequests).toHaveLength(0);
   });

   it('answers 502 and stores nothing when the NHL sends something unexpected', async () => {
      nhlRoutes = { schedule: () => new Response('{"weeks":[]}') };
      const response = await get('/schedule/2025-12-08');
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({
         error: 'The NHL sent a schedule this app does not recognize',
      });
      expect(await env.GAMES.get('schedule:v1:2025-12-08')).toBeNull();
   });

   it('answers 503 without asking the NHL once the NHL cap is reached', async () => {
      scheduleNhlCap.mockResolvedValue({ success: false });
      const response = await get('/schedule/2025-12-15');
      expect(response.status).toBe(503);
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(nhlRequests).toHaveLength(0);
   });
});
