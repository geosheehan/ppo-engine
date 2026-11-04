import { describe, expect, it } from 'vitest';
import { gameLabel } from '@layout/gameLabel';

describe('gameLabel', () => {
   it('shows the date and the matchup with the away team first', () => {
      expect(gameLabel({ date: '2023-12-31', away: 'SJS', home: 'COL' })).toBe(
         'Dec 31, 2023 · SJS @ COL',
      );
   });

   it('keeps the calendar date regardless of time zone', () => {
      expect(gameLabel({ date: '2018-01-01', away: 'TOR', home: 'CHI' })).toBe(
         'Jan 1, 2018 · TOR @ CHI',
      );
   });
});
