import { describe, expect, it } from 'vitest';
import { gameSummaryFromFile, localApi } from '@api/localApi';

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
