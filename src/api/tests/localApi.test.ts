import { describe, expect, it } from 'vitest';
import { gameSummaryFromFile, localApi, scheduleFromSummaries } from '@api/localApi';

describe('gameSummaryFromFile', () => {
   it('reads the date and teams from a saved game file name', () => {
      expect(gameSummaryFromFile('20231231-COLvSJS', '2023020555')).toEqual({
         id: '2023020555',
         date: '2023-12-31',
         home: 'COL',
         away: 'SJS',
      });
   });

   it('skips files that do not follow the naming convention', () => {
      expect(gameSummaryFromFile('notes', '1')).toBeUndefined();
   });
});

describe('localApi', () => {
   it('lists saved games by their NHL ID', async () => {
      for (const game of await localApi.listGames()) expect(game.id).toMatch(/^\d{10}$/);
   });

   it('rejects a game that is not saved', async () => {
      await expect(localApi.getGamePpo('1900020001')).rejects.toThrow('No saved game');
   });
});

describe('scheduleFromSummaries', () => {
   it('places saved games on their days of the week', () => {
      const days = scheduleFromSummaries(
         [
            { id: '2026020247', date: '2026-11-04', home: 'BUF', away: 'OTT' },
            { id: '2026020100', date: '2026-10-20', home: 'TOR', away: 'MTL' },
         ],
         '2026-11-02',
      );
      expect(days.map(({ date }) => date)).toEqual([
         '2026-11-02',
         '2026-11-03',
         '2026-11-04',
         '2026-11-05',
         '2026-11-06',
         '2026-11-07',
         '2026-11-08',
      ]);
      expect(days.flatMap(({ games }) => games)).toEqual([
         expect.objectContaining({
            id: 2026020247,
            gameState: 'OFF',
            awayTeam: { abbrev: 'OTT' },
            homeTeam: { abbrev: 'BUF' },
         }),
      ]);
      expect(days[2].games).toHaveLength(1);
   });
});
