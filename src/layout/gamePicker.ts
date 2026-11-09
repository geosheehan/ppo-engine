import { GAME_SCHEDULE_STATES, GAME_STATES, PERIOD_TYPES } from '@domain/constants';
import type { ScheduleGame, ScheduleWeek } from '@domain/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WEEKS_BACK = 1;

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' });
const MONTH_DAY_FORMAT = new Intl.DateTimeFormat('en-US', {
   month: 'short',
   day: 'numeric',
   timeZone: 'UTC',
});
const WEEKDAY_LONG_FORMAT = new Intl.DateTimeFormat('en-US', {
   weekday: 'long',
   month: 'long',
   day: 'numeric',
   timeZone: 'UTC',
});

const utcDay = (date: string) => new Date(`${date}T00:00:00Z`);
const isoDate = (day: Date) => day.toISOString().slice(0, 10);

export const addDays = (date: string, days: number): string =>
   isoDate(new Date(utcDay(date).getTime() + days * DAY_MS));

export const weekStartOf = (date: string): string =>
   addDays(date, -((utcDay(date).getUTCDay() + 6) % 7));

export const weekDates = (weekStart: string): string[] =>
   Array.from({ length: 7 }, (_, offset) => addDays(weekStart, offset));

export const localDate = (now: Date): string =>
   [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((part) => String(part).padStart(2, '0'))
      .join('-');

// Live games aren't supported yet, so the picker starts on last week, where every game is over.
export const defaultPickerWeek = (now: Date): string =>
   weekStartOf(addDays(localDate(now), -7 * DEFAULT_WEEKS_BACK));

export const isPickable = (game: ScheduleGame): boolean =>
   game.gameScheduleState === GAME_SCHEDULE_STATES.OK
   && (game.gameState === GAME_STATES.OFF || game.gameState === GAME_STATES.FINAL);

// Without a day picked, show the latest day that has a game to load.
export function pickerDay(week: ScheduleWeek, day: string | undefined): string {
   if (day !== undefined) return day;
   const withGames = week.days.filter(({ games }) => games.length > 0);
   const pickable = withGames.filter(({ games }) => games.some(isPickable));
   return (pickable.at(-1) ?? withGames.at(0))?.date ?? week.weekStart;
}

export const weekdayLabel = (date: string): string => WEEKDAY_FORMAT.format(utcDay(date));

export const monthDayLabel = (date: string): string => MONTH_DAY_FORMAT.format(utcDay(date));

export const longDayLabel = (date: string): string => WEEKDAY_LONG_FORMAT.format(utcDay(date));

export function weekRangeLabel(weekStart: string): string {
   const end = addDays(weekStart, 6);
   const year = end.slice(0, 4);
   return `${monthDayLabel(weekStart)} – ${monthDayLabel(end)}, ${year}`;
}

export function gameStatusLabel(game: ScheduleGame, timeZone?: string): string {
   if (game.gameScheduleState === GAME_SCHEDULE_STATES.POSTPONED) return 'Postponed';
   if (game.gameScheduleState === GAME_SCHEDULE_STATES.CANCELLED) return 'Cancelled';
   if (isPickable(game)) {
      return game.lastPeriodType === undefined || game.lastPeriodType === PERIOD_TYPES.REGULATION
         ? 'Final'
         : `Final/${game.lastPeriodType}`;
   }
   if (game.gameState === GAME_STATES.FUTURE || game.gameState === GAME_STATES.PREGAME) {
      return new Intl.DateTimeFormat('en-US', {
         hour: 'numeric',
         minute: '2-digit',
         timeZone,
      }).format(new Date(game.startTimeUTC));
   }
   return 'In progress';
}
