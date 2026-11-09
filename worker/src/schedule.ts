import { fetchFromNhl, loadOnce, NhlError } from './nhl';

export type ScheduleTeam = { abbrev: string; score?: number };

export type ScheduleGame = {
   id: number;
   gameType: number;
   gameState: string;
   gameScheduleState: string;
   startTimeUTC: string;
   awayTeam: ScheduleTeam;
   homeTeam: ScheduleTeam;
   // REG, OT or SO once the game is over.
   lastPeriodType?: string;
};

export type ScheduleWeek = {
   weekStart: string;
   previousStartDate?: string;
   nextStartDate?: string;
   preSeasonStartDate?: string;
   regularSeasonStartDate?: string;
   regularSeasonEndDate?: string;
   playoffEndDate?: string;
   days: { date: string; games: ScheduleGame[] }[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FIRST_NHL_SEASON = 1917;
// Preseason, regular season and playoffs: the game types /game/:id accepts.
const GAME_TYPES = new Set([1, 2, 3]);

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 60 * MINUTE_SECONDS;
const DAY_SECONDS = 24 * HOUR_SECONDS;
const ACTIVE_WEEK_SECONDS = 5 * MINUTE_SECONDS;
const UPCOMING_WEEK_SECONDS = 6 * HOUR_SECONDS;
const EMPTY_WEEK_SECONDS = DAY_SECONDS;

const scheduleUrl = (weekStart: string) => `https://api-web.nhle.com/v1/schedule/${weekStart}`;
// The v1 prefix lets a future change to the stored shape use fresh keys instead of migrating old ones.
const scheduleKey = (weekStart: string) => `schedule:v1:${weekStart}`;

// Every date in a week shares the stored copy for its Monday.
export function weekStartOf(date: string, now = new Date()): string | undefined {
   if (!DATE.test(date)) return undefined;
   const day = new Date(`${date}T00:00:00Z`);
   // Rejects dates like 2026-02-30, which Date would roll into March.
   if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== date) return undefined;
   const year = day.getUTCFullYear();
   if (year < FIRST_NHL_SEASON || year > now.getUTCFullYear() + 1) return undefined;
   day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
   return day.toISOString().slice(0, 10);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
   typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown) => (typeof value === 'string' ? value : undefined);
const count = (value: unknown) => (typeof value === 'number' ? value : undefined);

function trimTeam(team: unknown): ScheduleTeam | undefined {
   if (!isRecord(team)) return undefined;
   const abbrev = text(team.abbrev);
   if (abbrev === undefined) return undefined;
   const score = count(team.score);
   return score === undefined ? { abbrev } : { abbrev, score };
}

function trimGame(game: unknown): ScheduleGame | undefined {
   if (!isRecord(game)) return undefined;
   const id = count(game.id);
   const gameType = count(game.gameType);
   const gameState = text(game.gameState);
   const gameScheduleState = text(game.gameScheduleState);
   const startTimeUTC = text(game.startTimeUTC);
   const awayTeam = trimTeam(game.awayTeam);
   const homeTeam = trimTeam(game.homeTeam);
   if (
      id === undefined
      || gameType === undefined
      || !GAME_TYPES.has(gameType)
      || gameState === undefined
      || gameScheduleState === undefined
      || startTimeUTC === undefined
      || awayTeam === undefined
      || homeTeam === undefined
   ) {
      return undefined;
   }
   const trimmed: ScheduleGame = {
      id,
      gameType,
      gameState,
      gameScheduleState,
      startTimeUTC,
      awayTeam,
      homeTeam,
   };
   const lastPeriodType = isRecord(game.gameOutcome)
      ? text(game.gameOutcome.lastPeriodType)
      : undefined;
   if (lastPeriodType !== undefined) trimmed.lastPeriodType = lastPeriodType;
   return trimmed;
}

// Keeps only what the game picker shows; drops TV, ticket and betting details.
export function trimSchedule(body: string, weekStart: string): ScheduleWeek {
   let schedule: unknown;
   try {
      schedule = JSON.parse(body);
   } catch {
      schedule = undefined;
   }
   if (!isRecord(schedule) || !Array.isArray(schedule.gameWeek)) {
      throw new NhlError(502, 'The NHL sent a schedule this app does not recognize');
   }
   const days = schedule.gameWeek.flatMap((day) => {
      const date = isRecord(day) ? text(day.date) : undefined;
      if (date === undefined || !isRecord(day) || !Array.isArray(day.games)) return [];
      return [{ date, games: day.games.flatMap((game) => trimGame(game) ?? []) }];
   });
   const week: ScheduleWeek = { weekStart, days };
   for (const field of [
      'previousStartDate',
      'nextStartDate',
      'preSeasonStartDate',
      'regularSeasonStartDate',
      'regularSeasonEndDate',
      'playoffEndDate',
   ] as const) {
      const value = text(schedule[field]);
      if (value !== undefined) week[field] = value;
   }
   return week;
}

// Postponed and cancelled games won't change any more either.
const isSettled = (game: ScheduleGame) =>
   game.gameState === 'OFF' || game.gameScheduleState !== 'OK';

// Seconds to keep the week, or undefined to keep it for good once every game is settled.
export function weekLifetime(week: ScheduleWeek, now = Date.now()): number | undefined {
   const games = week.days.flatMap((day) => day.games);
   // Offseason weeks may still get games added.
   if (games.length === 0) return EMPTY_WEEK_SECONDS;
   const unsettled = games.filter((game) => !isSettled(game));
   if (unsettled.length === 0) return undefined;
   const soonest = Math.min(...unsettled.map((game) => Date.parse(game.startTimeUTC)));
   return soonest - now < UPCOMING_WEEK_SECONDS * 1000
      ? ACTIVE_WEEK_SECONDS
      : UPCOMING_WEEK_SECONDS;
}

const scheduleResponse = (body: string, lifetime: number | undefined) =>
   new Response(body, {
      headers: {
         'Content-Type': 'application/json',
         'Cache-Control': `public, max-age=${lifetime ?? DAY_SECONDS}`,
      },
   });

type StoredWeek = { body: string; lifetime: number | undefined };

async function loadSchedule(weekStart: string, env: Env): Promise<StoredWeek> {
   const week = trimSchedule(
      await fetchFromNhl(scheduleUrl(weekStart), env, 'The NHL has no schedule for that week'),
      weekStart,
   );
   const body = JSON.stringify(week);
   const lifetime = weekLifetime(week);
   try {
      await env.GAMES.put(scheduleKey(weekStart), body, {
         expirationTtl: lifetime,
         metadata: { lifetime },
      });
   } catch (error) {
      console.error(`Could not store the schedule for ${weekStart}`, error);
   }
   return { body, lifetime };
}

export async function handleSchedule(
   date: string,
   env: Env,
   ctx: ExecutionContext,
): Promise<Response> {
   const weekStart = weekStartOf(date);
   if (weekStart === undefined) {
      return Response.json({ error: `Not a date in NHL history: ${date}` }, { status: 400 });
   }

   const stored = await env.GAMES.getWithMetadata<{ lifetime?: number }>(scheduleKey(weekStart), {
      type: 'text',
      cacheTtl: MINUTE_SECONDS,
   });
   if (stored.value !== null) return scheduleResponse(stored.value, stored.metadata?.lifetime);

   const { body, lifetime } = await loadOnce(scheduleKey(weekStart), ctx, () =>
      loadSchedule(weekStart, env),
   );
   return scheduleResponse(body, lifetime);
}
