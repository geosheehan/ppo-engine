import { fetchFromNhl, loadOnce, NhlError } from './nhl';
import { handleSchedule } from './schedule';

const GAME_PATH = /^\/game\/([^/]+)$/;
const SCHEDULE_PATH = /^\/schedule\/([^/]+)$/;
// Season start year, game type (01 preseason, 02 regular season, 03 playoffs), game number.
const GAME_ID = /^\d{4}0[123]\d{4}$/;

const FINISHED = /"gameState"\s*:\s*"(OFF|FINAL)"/;
const SHIFT_TOTAL = /"total"\s*:\s*(\d+)\s*}\s*$/;

const DAY_SECONDS = 24 * 60 * 60;

const allowedOrigins = (env: Env) =>
   new Set(env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()));

const playByPlayUrl = (id: string) => `https://api-web.nhle.com/v1/gamecenter/${id}/play-by-play`;
const shiftsUrl = (id: string) =>
   `https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=${id}`;

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
   Response.json(body, { status, headers });

const gameResponse = (body: BodyInit) =>
   new Response(body, {
      headers: {
         'Content-Type': 'application/json',
         'Cache-Control': `public, max-age=${DAY_SECONDS}`,
      },
   });

// The v1 prefix lets a future change to the stored shape use fresh keys instead of migrating old ones.
const gameKey = (id: string) => `v1:${id}`;

const NO_SUCH_GAME = 'The NHL has no such game';

async function loadGame(id: string, env: Env): Promise<string> {
   const playByPlay = await fetchFromNhl(playByPlayUrl(id), env, NO_SUCH_GAME);
   if (!FINISHED.test(playByPlay)) throw new NhlError(409, `Game ${id} has not finished`);

   const shifts = await fetchFromNhl(shiftsUrl(id), env, NO_SUCH_GAME);
   const total = SHIFT_TOTAL.exec(shifts)?.[1];
   if (total === undefined || Number(total) === 0) {
      throw new NhlError(502, `The NHL has no shifts for game ${id} yet`);
   }

   const body = `{"game":${playByPlay},"shifts":${shifts}}`;
   try {
      await env.GAMES.put(gameKey(id), body);
   } catch (error) {
      console.error(`Could not store game ${id}`, error);
   }
   return body;
}

async function handleGame(id: string, env: Env, ctx: ExecutionContext): Promise<Response> {
   if (!GAME_ID.test(id)) {
      return json({ error: `Not a preseason, regular season or playoff game ID: ${id}` }, 400);
   }

   const stored = await env.GAMES.get(gameKey(id), { type: 'stream', cacheTtl: DAY_SECONDS });
   if (stored !== null) return gameResponse(stored);

   return gameResponse(await loadOnce(gameKey(id), ctx, () => loadGame(id, env)));
}

async function handleGet(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
   // Counted before routing so bad paths and IDs can't be probed for free.
   const visitor = request.headers.get('CF-Connecting-IP') ?? 'unknown';
   const { success } = await env.PER_VISITOR.limit({ key: visitor });
   if (!success) return json({ error: 'Too many requests' }, 429, { 'Retry-After': '60' });

   const { pathname } = new URL(request.url);
   const game = GAME_PATH.exec(pathname);
   const schedule = SCHEDULE_PATH.exec(pathname);
   try {
      if (game !== null) return await handleGame(game[1], env, ctx);
      if (schedule !== null) return await handleSchedule(schedule[1], env, ctx);
   } catch (error) {
      if (!(error instanceof NhlError)) throw error;
      const headers = error.status === 503 ? { 'Retry-After': '60' } : undefined;
      return json({ error: error.message }, error.status, headers);
   }
   return json({ error: 'Not found' }, 404);
}

function withCors(request: Request, env: Env, response: Response): Response {
   const withHeaders = new Response(response.body, response);
   const origin = request.headers.get('Origin');
   if (origin !== null && allowedOrigins(env).has(origin)) {
      withHeaders.headers.set('Access-Control-Allow-Origin', origin);
      withHeaders.headers.set('Access-Control-Expose-Headers', 'Retry-After');
   }
   withHeaders.headers.append('Vary', 'Origin');
   return withHeaders;
}

export default {
   async fetch(request, env, ctx): Promise<Response> {
      if (request.method === 'OPTIONS') {
         return withCors(
            request,
            env,
            new Response(null, {
               status: 204,
               headers: {
                  'Access-Control-Allow-Methods': 'GET',
                  'Access-Control-Max-Age': '86400',
               },
            }),
         );
      }
      if (request.method !== 'GET') {
         return withCors(
            request,
            env,
            json({ error: 'Method not allowed' }, 405, { Allow: 'GET, OPTIONS' }),
         );
      }
      return withCors(request, env, await handleGet(request, env, ctx));
   },
} satisfies ExportedHandler<Env>;
