const NHL_TIMEOUT_MS = 10_000;
const USER_AGENT = 'ppo-engine';

export class NhlError extends Error {
   constructor(
      readonly status: number,
      message: string,
   ) {
      super(message);
   }
}

export async function fetchFromNhl(url: string, env: Env, notFound: string): Promise<string> {
   const { success } = await env.TO_NHL.limit({ key: 'nhl' });
   if (!success)
      throw new NhlError(503, 'Too many new NHL requests right now, try again in a minute');

   let response: Response;
   try {
      response = await fetch(url, {
         headers: { 'User-Agent': USER_AGENT },
         signal: AbortSignal.timeout(NHL_TIMEOUT_MS),
      });
   } catch {
      throw new NhlError(502, 'The NHL did not answer');
   }
   if (response.status === 404) throw new NhlError(404, notFound);
   if (!response.ok) throw new NhlError(502, `The NHL answered ${response.status}`);
   return response.text();
}

// Requests for the same key that arrive together in this isolate share one load.
// Only plain data is shared: Responses and streams can't cross requests.
const loading = new Map<string, Promise<unknown>>();

export function loadOnce<T>(
   key: string,
   ctx: ExecutionContext,
   load: () => Promise<T>,
): Promise<T> {
   let shared = loading.get(key) as Promise<T> | undefined;
   if (shared === undefined) {
      shared = load().finally(() => loading.delete(key));
      loading.set(key, shared);
      // The load runs in the first request's context; keep it alive if that visitor leaves.
      ctx.waitUntil(shared.catch(() => undefined));
   }
   return shared;
}
