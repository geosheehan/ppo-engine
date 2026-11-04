import { describe, expect, it } from 'vitest';
import { gameSummaryFromId, localApi } from '@api/localApi';

describe('gameSummaryFromId', () => {
   it('reads the date and teams from a saved game file name', () => {
      expect(gameSummaryFromId('20231231-COLvSJS')).toEqual({
         id: '20231231-COLvSJS',
         date: '2023-12-31',
         home: 'COL',
         away: 'SJS',
      });
   });

   it('skips files that do not follow the naming convention', () => {
      expect(gameSummaryFromId('notes')).toBeUndefined();
   });
});

describe('localApi', () => {
   it('rejects a game that is not saved', async () => {
      await expect(localApi.getGamePpo('19000101-AAAvBBB')).rejects.toThrow('No saved game');
   });
});
