import { trimSchedule, weekLifetime, weekStartOf } from '../src/schedule';
import type { ScheduleGame, ScheduleWeek } from '../src/schedule';
import { describe, expect, it } from 'vitest';

const NOW = new Date('2026-11-09T12:00:00Z');

describe('weekStartOf', () => {
   it.each([
      ['2026-11-09', '2026-11-09'],
      ['2026-11-11', '2026-11-09'],
      ['2026-11-15', '2026-11-09'],
      ['2011-02-11', '2011-02-07'],
      ['2027-01-01', '2026-12-28'],
   ])('moves %s to the Monday %s', (date, monday) => {
      expect(weekStartOf(date, NOW)).toBe(monday);
   });

   it.each(['2026-02-30', '2026-13-01', '2026-11-9', 'today', '1916-12-31', '2028-01-01'])(
      'refuses %s',
      (date) => {
         expect(weekStartOf(date, NOW)).toBeUndefined();
      },
   );
});

const nhlGame = (overrides: Record<string, unknown> = {}) => ({
   id: 2026020200,
   season: 20262027,
   gameType: 2,
   gameState: 'OFF',
   gameScheduleState: 'OK',
   startTimeUTC: '2026-11-03T00:00:00Z',
   tvBroadcasts: [{ network: 'TV' }],
   ticketsLink: 'https://example.com/tickets',
   awayTeam: { abbrev: 'AAA', score: 2, logo: 'a.svg', odds: [{ value: '+120' }] },
   homeTeam: { abbrev: 'BBB', score: 3, logo: 'b.svg', odds: [{ value: '-140' }] },
   gameOutcome: { lastPeriodType: 'OT' },
   ...overrides,
});

const nhlWeek = (games: unknown[]) =>
   JSON.stringify({
      previousStartDate: '2026-10-26',
      nextStartDate: '2026-11-09',
      preSeasonStartDate: '2026-09-19',
      regularSeasonStartDate: '2026-09-29',
      regularSeasonEndDate: '2027-04-10',
      playoffEndDate: '2027-06-10',
      oddsPartners: [{ name: 'Bookmaker' }],
      gameWeek: [{ date: '2026-11-02', dayAbbrev: 'MON', datePromo: [], games }],
   });

describe('trimSchedule', () => {
   it('keeps only what the picker shows', () => {
      expect(trimSchedule(nhlWeek([nhlGame()]), '2026-11-02')).toEqual({
         weekStart: '2026-11-02',
         previousStartDate: '2026-10-26',
         nextStartDate: '2026-11-09',
         preSeasonStartDate: '2026-09-19',
         regularSeasonStartDate: '2026-09-29',
         regularSeasonEndDate: '2027-04-10',
         playoffEndDate: '2027-06-10',
         days: [
            {
               date: '2026-11-02',
               games: [
                  {
                     id: 2026020200,
                     gameType: 2,
                     gameState: 'OFF',
                     gameScheduleState: 'OK',
                     startTimeUTC: '2026-11-03T00:00:00Z',
                     awayTeam: { abbrev: 'AAA', score: 2 },
                     homeTeam: { abbrev: 'BBB', score: 3 },
                     lastPeriodType: 'OT',
                  },
               ],
            },
         ],
      });
   });

   it('leaves out scores and outcome before a game is played', () => {
      const future = nhlGame({
         gameState: 'FUT',
         awayTeam: { abbrev: 'AAA' },
         homeTeam: { abbrev: 'BBB' },
         gameOutcome: undefined,
      });
      const [game] = trimSchedule(nhlWeek([future]), '2026-11-02').days[0].games;
      expect(game).toEqual({
         id: 2026020200,
         gameType: 2,
         gameState: 'FUT',
         gameScheduleState: 'OK',
         startTimeUTC: '2026-11-03T00:00:00Z',
         awayTeam: { abbrev: 'AAA' },
         homeTeam: { abbrev: 'BBB' },
      });
   });

   it('drops games of other types and games it cannot read', () => {
      const games = [
         nhlGame({ id: 1, gameType: 4 }),
         nhlGame({ id: 2, homeTeam: {} }),
         nhlGame({ id: 3, startTimeUTC: 5 }),
         'not a game',
         nhlGame({ id: 4, gameType: 3 }),
      ];
      const trimmed = trimSchedule(nhlWeek(games), '2026-11-02').days[0].games;
      expect(trimmed.map((game) => game.id)).toEqual([4]);
   });

   it.each([
      ['not JSON', '{"gameWeek":'],
      ['no week', '{"games":[]}'],
      ['a list', '[]'],
   ])('refuses %s', (_, body) => {
      expect(() => trimSchedule(body, '2026-11-02')).toThrow(
         'The NHL sent a schedule this app does not recognize',
      );
   });
});

const week = (games: Partial<ScheduleGame>[]): ScheduleWeek => ({
   weekStart: '2026-11-09',
   days: [
      {
         date: '2026-11-09',
         games: games.map((game) => ({
            id: 1,
            gameType: 2,
            gameState: 'OFF',
            gameScheduleState: 'OK',
            startTimeUTC: '2026-11-09T00:00:00Z',
            awayTeam: { abbrev: 'AAA' },
            homeTeam: { abbrev: 'BBB' },
            ...game,
         })),
      },
   ],
});

describe('weekLifetime', () => {
   const now = NOW.getTime();

   it('keeps a week for good once every game is settled', () => {
      const settled = week([
         {},
         { gameState: 'FUT', gameScheduleState: 'PPD' },
         { gameScheduleState: 'CNCL' },
      ]);
      expect(weekLifetime(settled, now)).toBeUndefined();
   });

   it('rechecks every 5 minutes while games are under way or about to start', () => {
      expect(weekLifetime(week([{}, { gameState: 'LIVE' }]), now)).toBe(5 * 60);
      expect(weekLifetime(week([{ gameState: 'FINAL' }]), now)).toBe(5 * 60);
      expect(
         weekLifetime(week([{ gameState: 'FUT', startTimeUTC: '2026-11-09T17:00:00Z' }]), now),
      ).toBe(5 * 60);
   });

   it('rechecks every 6 hours while the next game is further off', () => {
      const upcoming = week([{ gameState: 'FUT', startTimeUTC: '2026-11-10T01:00:00Z' }]);
      expect(weekLifetime(upcoming, now)).toBe(6 * 60 * 60);
   });

   it('rechecks a week without games daily', () => {
      expect(weekLifetime({ weekStart: '2026-07-06', days: [] }, now)).toBe(24 * 60 * 60);
   });
});
