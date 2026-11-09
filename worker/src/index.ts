const GAME_PATH = /^\/game\/([^/]+)$/;
// Season start year, game type (01 preseason, 02 regular season, 03 playoffs), game number.
const GAME_ID = /^\d{4}0[123]\d{4}$/;

const FINISHED = /"gameState"\s*:\s*"(OFF|FINAL)"/;
const SHIFT_TOTAL = /"total"\s*:\s*(\d+)\s*}\s*$/;

const DAY_SECONDS = 24 * 60 * 60;
const NHL_TIMEOUT_MS = 10_000;
const USER_AGENT = 'ppo-engine';

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

class NhlError extends Error {
   constructor(
      readonly status: number,
      message: string,
   ) {
      super(message);
   }
}

async function fetchFromNhl(url: string, env: Env): Promise<string> {
   const { success } = await env.TO_NHL.limit({ key: 'nhl' });
   if (!success) throw new NhlError(503, 'Too many new games right now, try again in a minute');

   let response: Response;
   try {
      response = await fetch(url, {
         headers: { 'User-Agent': USER_AGENT },
         signal: AbortSignal.timeout(NHL_TIMEOUT_MS),
      });
   } catch {
      throw new NhlError(502, 'The NHL did not answer');
   }
   if (response.status === 404) throw new NhlError(404, 'The NHL has no such game');
   if (!response.ok) throw new NhlError(502, `The NHL answered ${response.status}`);
   return response.text();
}

async function loadGame(id: string, env: Env): Promise<Response> {
   const playByPlay = await fetchFromNhl(playByPlayUrl(id), env);
   if (!FINISHED.test(playByPlay)) throw new NhlError(409, `Game ${id} has not finished`);

   const shifts = await fetchFromNhl(shiftsUrl(id), env);
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
   return gameResponse(body);
}

export default {
   async fetch(request, env): Promise<Response> {
      if (request.method !== 'GET') {
         return json({ error: 'Method not allowed' }, 405, { Allow: 'GET' });
      }

      // Counted before routing so bad paths and IDs can't be probed for free.
      const visitor = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      const { success } = await env.PER_VISITOR.limit({ key: visitor });
      if (!success) return json({ error: 'Too many requests' }, 429, { 'Retry-After': '60' });

      const match = GAME_PATH.exec(new URL(request.url).pathname);
      if (match === null) return json({ error: 'Not found' }, 404);

      const [, id] = match;
      if (!GAME_ID.test(id)) {
         return json({ error: `Not a preseason, regular season or playoff game ID: ${id}` }, 400);
      }

      const stored = await env.GAMES.get(gameKey(id), { type: 'stream', cacheTtl: DAY_SECONDS });
      if (stored !== null) return gameResponse(stored);

      try {
         return await loadGame(id, env);
      } catch (error) {
         if (!(error instanceof NhlError)) throw error;
         const headers = error.status === 503 ? { 'Retry-After': '60' } : undefined;
         return json({ error: error.message }, error.status, headers);
      }
   },
} satisfies ExportedHandler<Env>;
