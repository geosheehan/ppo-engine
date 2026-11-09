const GAME_PATH = /^\/game\/([^/]+)$/;
// Season start year, game type (01 preseason, 02 regular season, 03 playoffs), game number.
const GAME_ID = /^\d{4}0[123]\d{4}$/;

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
   Response.json(body, { status, headers });

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

      return json({ id });
   },
} satisfies ExportedHandler<Env>;
