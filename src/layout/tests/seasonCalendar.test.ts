import { describe, expect, it } from 'vitest';
import {
   monthGrid,
   monthLabel,
   monthYearLabel,
   seasonLabel,
   seasonMonths,
   seasonOf,
   seasonsUpTo,
   yearOfSeasonMonth,
} from '@layout/seasonCalendar';

describe('seasons', () => {
   it.each([
      ['2026-11-09', 2026],
      ['2026-09-01', 2026],
      ['2027-06-15', 2026],
      ['2026-08-31', 2025],
   ])('puts %s in the %i season', (date, season) => {
      expect(seasonOf(date)).toBe(season);
   });

   it('lists every season back to 1917–18, newest first', () => {
      const seasons = seasonsUpTo('2026-11-09');
      expect(seasons.at(0)).toBe(2026);
      expect(seasons.at(-1)).toBe(1917);
      expect(seasons).toHaveLength(110);
   });

   it('names a season by both years', () => {
      expect(seasonLabel(2026)).toBe('2026–27');
      expect(seasonLabel(1999)).toBe('1999–00');
   });
});

describe('months', () => {
   it('runs from September through August', () => {
      expect(seasonMonths().map(monthLabel)).toEqual([
         'Sep',
         'Oct',
         'Nov',
         'Dec',
         'Jan',
         'Feb',
         'Mar',
         'Apr',
         'May',
         'Jun',
         'Jul',
         'Aug',
      ]);
   });

   it('places fall months in the first year and the rest in the second', () => {
      expect(yearOfSeasonMonth(2026, 10)).toBe(2026);
      expect(yearOfSeasonMonth(2026, 2)).toBe(2027);
      expect(monthYearLabel(2026, 2)).toBe('February 2027');
   });

   it('places summer months in the second year', () => {
      expect(yearOfSeasonMonth(2019, 8)).toBe(2020);
      expect(monthYearLabel(2020, 7)).toBe('July 2021');
   });
});

describe('monthGrid', () => {
   it('lays out a month in Monday-first weeks', () => {
      const weeks = monthGrid(2026, 11);
      expect(weeks).toHaveLength(6);
      expect(weeks[0]).toEqual([
         undefined,
         undefined,
         undefined,
         undefined,
         undefined,
         undefined,
         '2026-11-01',
      ]);
      expect(weeks[5]).toEqual(['2026-11-30', ...Array<undefined>(6).fill(undefined)]);
   });

   it('covers a February that fills four weeks exactly', () => {
      const weeks = monthGrid(2026, 2);
      expect(weeks).toHaveLength(4);
      expect(weeks[0][0]).toBe('2027-02-01');
      expect(weeks[3][6]).toBe('2027-02-28');
   });
});
