import { addDays, weekStartOf } from '@layout/gamePicker';

const FIRST_SEASON = 1917;
// Preseason starts in September. July and August stay in because some seasons ran late (the 2020 bubble playoffs,
// the 2021 Final).
const SEASON_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
const FIRST_SEASON_MONTH = SEASON_MONTHS[0];

const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
const MONTH_YEAR_FORMAT = new Intl.DateTimeFormat('en-US', {
   month: 'long',
   year: 'numeric',
   timeZone: 'UTC',
});

const pad = (value: number) => String(value).padStart(2, '0');
const monthStart = (year: number, month: number) => `${year}-${pad(month)}-01`;

// A season is named by the year it starts in.
export function seasonOf(date: string): number {
   const year = Number(date.slice(0, 4));
   return Number(date.slice(5, 7)) >= FIRST_SEASON_MONTH ? year : year - 1;
}

export const seasonsUpTo = (date: string): number[] =>
   Array.from({ length: seasonOf(date) - FIRST_SEASON + 1 }, (_, index) => seasonOf(date) - index);

export const seasonLabel = (season: number): string =>
   `${season}–${String((season + 1) % 100).padStart(2, '0')}`;

export const seasonMonths = (): number[] => SEASON_MONTHS;

export const monthOf = (date: string): number => Number(date.slice(5, 7));

export const yearOfSeasonMonth = (season: number, month: number): number =>
   month >= FIRST_SEASON_MONTH ? season : season + 1;

export const monthLabel = (month: number): string =>
   MONTH_FORMAT.format(new Date(`${monthStart(2000, month)}T00:00:00Z`));

export const monthYearLabel = (season: number, month: number): string =>
   MONTH_YEAR_FORMAT.format(
      new Date(`${monthStart(yearOfSeasonMonth(season, month), month)}T00:00:00Z`),
   );

export function monthGrid(season: number, month: number): (string | undefined)[][] {
   const first = monthStart(yearOfSeasonMonth(season, month), month);
   const weeks: (string | undefined)[][] = [];
   for (let weekStart = weekStartOf(first); ; weekStart = addDays(weekStart, 7)) {
      const days = Array.from({ length: 7 }, (_, offset) => addDays(weekStart, offset));
      if (!days.some((day) => monthOf(day) === month)) break;
      weeks.push(days.map((day) => (monthOf(day) === month ? day : undefined)));
   }
   return weeks;
}
