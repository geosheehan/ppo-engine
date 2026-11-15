import { fetchFromNhl, loadOnce, NhlError } from './nhl';
import { handleSchedule } from './schedule';

const GAME_PATH = /^\/game\/([^/]+)$/;
const SCHEDULE_PATH = /^\/schedule\/([^/]+)$/;
// Season start year, game type (01 preseason, 02 regular season, 03 playoffs), game number.
const GAME_ID = /^\d{4}0[123]\d{4}$/;

const FINISHED = /"gameState"\s*:\s*"(OFF|FINAL)"/;
const SHIFT_TOTAL = /"total"\s*:\s*(\d+)\s*}\s*$/;
const GAME_DATE = /"gameDate"\s*:\s*"(\d{4}-\d{2}-\d{2})"/;

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 60 * MINUTE_SECONDS;
const DAY_SECONDS = 24 * HOUR_SECONDS;
const DAY_MS = DAY_SECONDS * 1000;
const STORED_GAME_SECONDS = 365 * DAY_SECONDS;

const allowedOrigins = (env: Env) =>
   new Set(env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()));

const playByPlayUrl = (id: string) => `https://api-web.nhle.com/v1/gamecenter/${id}/play-by-play`;
const shiftsUrl = (id: string) =>
   `https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=${id}`;

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
   Response.json(body, { status, headers });

// Games are stored gzipped and sent as they are. 'manual' stops the runtime from encoding them again.
const gameResponse = (gzipped: BodyInit, lifetime?: number) =>
   new Response(gzipped, {
      encodeBody: 'manual',
      headers: {
         'Content-Type': 'application/json',
         'Content-Encoding': 'gzip',
         'Cache-Control': `public, max-age=${lifetime ?? DAY_SECONDS}`,
      },
   });

const gzip = (text: string): Promise<ArrayBuffer> =>
   new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();

// The NHL often posts shift charts hours after a game, so a game without them is kept only for a while and then
// asked for again: hourly for two weeks, monthly until it is three months old, then kept like any finished game
// (undefined).
export function shiftlessLifetime(
   gameDate: string | undefined,
   now = Date.now(),
): number | undefined {
   const played = gameDate === undefined ? Number.NaN : Date.parse(`${gameDate}T00:00:00Z`);
   if (Number.isNaN(played)) return HOUR_SECONDS;
   const days = (now - played) / DAY_MS;
   if (days > 90) return undefined;
   if (days > 14) return 30 * DAY_SECONDS;
   return HOUR_SECONDS;
}

// The version prefix lets a change to the stored shape use fresh keys instead of migrating old ones.
const gameKey = (id: string) => `v2:${id}`;

const NO_SUCH_GAME = 'The NHL has no such game';

type LoadedGame = { gzipped: ArrayBuffer; lifetime?: number };

async function loadGame(id: string, env: Env): Promise<LoadedGame> {
   const playByPlay = await fetchFromNhl(playByPlayUrl(id), env, NO_SUCH_GAME);
   if (!FINISHED.test(playByPlay)) throw new NhlError(409, `Game ${id} has not finished`);

   const shifts = await fetchFromNhl(shiftsUrl(id), env, NO_SUCH_GAME);
   const total = SHIFT_TOTAL.exec(shifts)?.[1];
   if (total === undefined) {
      throw new NhlError(502, `The NHL sent shifts for game ${id} that can't be read`);
   }
   const lifetime =
      Number(total) === 0 ? shiftlessLifetime(GAME_DATE.exec(playByPlay)?.[1]) : undefined;

   const gzipped = await gzip(`{"game":${playByPlay},"shifts":${shifts}}`);
   try {
      await env.GAMES.put(gameKey(id), gzipped, {
         expirationTtl: lifetime ?? STORED_GAME_SECONDS,
         metadata: lifetime === undefined ? undefined : { lifetime },
      });
   } catch (error) {
      console.error(`Could not store game ${id}`, error);
   }
   return { gzipped, lifetime };
}

async function handleGame(id: string, env: Env, ctx: ExecutionContext): Promise<Response> {
   if (!GAME_ID.test(id)) {
      return json({ error: `Not a preseason, regular season or playoff game ID: ${id}` }, 400);
   }

   // A short edge cache, so a game stored without shifts can't outlive its expiry by more than a minute.
   const stored = await env.GAMES.getWithMetadata<{ lifetime?: number }>(gameKey(id), {
      type: 'stream',
      cacheTtl: MINUTE_SECONDS,
   });
   if (stored.value !== null) return gameResponse(stored.value, stored.metadata?.lifetime);

   const { gzipped, lifetime } = await loadOnce(gameKey(id), ctx, () => loadGame(id, env));
   return gameResponse(gzipped, lifetime);
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
