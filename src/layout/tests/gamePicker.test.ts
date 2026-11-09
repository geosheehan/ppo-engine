import { describe, expect, it } from 'vitest';
import {
   addDays,
   defaultPickerWeek,
   gameStatusLabel,
   isPickable,
   localDate,
   pickerDay,
   weekDates,
   weekRangeLabel,
   weekStartOf,
} from '@layout/gamePicker';
import type { ScheduleGame, ScheduleWeek } from '@domain/types';

const game = (overrides: Partial<ScheduleGame> = {}): ScheduleGame => ({
   id: 2026020200,
   gameType: 2,
   gameState: 'OFF',
   gameScheduleState: 'OK',
   startTimeUTC: '2026-11-03T00:00:00Z',
   awayTeam: { abbrev: 'AAA', score: 2 },
   homeTeam: { abbrev: 'BBB', score: 3 },
   lastPeriodType: 'REG',
   ...overrides,
});

const week = (days: Record<string, ScheduleGame[]>): ScheduleWeek => ({
   weekStart: '2026-11-02',
   days: Object.entries(days).map(([date, games]) => ({ date, games })),
});

describe('dates', () => {
   it('adds days across months and years', () => {
      expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
      expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
   });

   it.each([
      ['2026-11-02', '2026-11-02'],
      ['2026-11-05', '2026-11-02'],
      ['2026-11-08', '2026-11-02'],
      ['2027-01-01', '2026-12-28'],
   ])('puts %s in the week of Monday %s', (date, monday) => {
      expect(weekStartOf(date)).toBe(monday);
   });

   it('lists the seven days of a week', () => {
      expect(weekDates('2026-12-28')).toEqual([
         '2026-12-28',
         '2026-12-29',
         '2026-12-30',
         '2026-12-31',
         '2027-01-01',
         '2027-01-02',
         '2027-01-03',
      ]);
   });

   it('reads the local date and starts on last week', () => {
      const now = new Date(2026, 10, 9, 23, 30);
      expect(localDate(now)).toBe('2026-11-09');
      expect(defaultPickerWeek(now)).toBe('2026-11-02');
   });

   it('labels a week that spans two years by its end', () => {
      expect(weekRangeLabel('2026-12-28')).toBe('Dec 28 – Jan 3, 2027');
   });
});

describe('isPickable', () => {
   it('allows finished games only', () => {
      expect(isPickable(game())).toBe(true);
      expect(isPickable(game({ gameState: 'FINAL' }))).toBe(true);
      expect(isPickable(game({ gameState: 'LIVE' }))).toBe(false);
      expect(isPickable(game({ gameState: 'FUT' }))).toBe(false);
      expect(isPickable(game({ gameScheduleState: 'PPD' }))).toBe(false);
   });
});

describe('pickerDay', () => {
   it('keeps a day that was picked', () => {
      expect(pickerDay(week({ '2026-11-03': [game()] }), '2026-11-05')).toBe('2026-11-05');
   });

   it('starts on the latest day with a finished game', () => {
      const days = {
         '2026-11-03': [game()],
         '2026-11-05': [game()],
         '2026-11-07': [game({ gameState: 'FUT' })],
         '2026-11-08': [],
      };
      expect(pickerDay(week(days), undefined)).toBe('2026-11-05');
   });

   it('falls back to the first day with games, then the week start', () => {
      const future = {
         '2026-11-04': [game({ gameState: 'FUT' })],
         '2026-11-06': [game({ gameState: 'FUT' })],
      };
      expect(pickerDay(week(future), undefined)).toBe('2026-11-04');
      expect(pickerDay(week({}), undefined)).toBe('2026-11-02');
   });
});

describe('gameStatusLabel', () => {
   it('shows how a finished game ended', () => {
      expect(gameStatusLabel(game())).toBe('Final');
      expect(gameStatusLabel(game({ lastPeriodType: 'OT' }))).toBe('Final/OT');
      expect(gameStatusLabel(game({ lastPeriodType: 'SO' }))).toBe('Final/SO');
   });

   it('shows the start time of a game not yet played', () => {
      const future = game({ gameState: 'FUT', startTimeUTC: '2026-11-10T00:00:00Z' });
      expect(gameStatusLabel(future, 'America/New_York')).toBe('7:00 PM');
   });

   it('names postponed, cancelled and live games', () => {
      expect(gameStatusLabel(game({ gameState: 'FUT', gameScheduleState: 'PPD' }))).toBe(
         'Postponed',
      );
      expect(gameStatusLabel(game({ gameState: 'FUT', gameScheduleState: 'CNCL' }))).toBe(
         'Cancelled',
      );
      expect(gameStatusLabel(game({ gameState: 'LIVE' }))).toBe('In progress');
   });
});
