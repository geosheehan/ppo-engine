import { describe, expect, it } from 'vitest';
import type { Game } from '@domain/types';
import { OnIceStrength, isThreeOnThreeOvertime, overtimeStrength } from '@engine/strength';

describe('isThreeOnThreeOvertime', () => {
   const game = (gameType: number, season = 20262027) => ({ gameType, season, regPeriods: 3 }) as Game;
   const overtime = 3 * 20 * 60 + 30;

   it.each([
      ['pre-season', 1, true],
      ['regular season', 2, true],
      ['playoffs', 3, false],
   ])('%s overtime', (_, gameType, expected) => {
      expect(isThreeOnThreeOvertime(game(gameType), overtime)).toBe(expected);
   });

   it('is never 3-on-3 in regulation', () => {
      expect(isThreeOnThreeOvertime(game(2), overtime - 60)).toBe(false);
   });

   it('is not 3-on-3 before the 2015-16 season', () => {
      expect(isThreeOnThreeOvertime(game(2, 20142015), overtime)).toBe(false);
   });
});

describe('overtimeStrength (Rule 84.3)', () => {
   it.each([
      [{ away: 5, home: 5 }, { away: 3, home: 3 }],
      [{ away: 4, home: 4 }, { away: 3, home: 3 }],
      [{ away: 5, home: 4 }, { away: 4, home: 3 }],
      [{ away: 4, home: 5 }, { away: 3, home: 4 }],
      [{ away: 5, home: 3 }, { away: 5, home: 3 }],
      [{ away: 4, home: 3 }, { away: 4, home: 3 }],
   ])('maps regulation %o to %o', (entitled, expected) => {
      expect(overtimeStrength(entitled)).toEqual(expected);
   });
});

describe('OnIceStrength in 3-on-3 overtime (Table 16)', () => {
   it('adds a skater when a penalty ends during play, and resets at the next stoppage', () => {
      const onIce = new OnIceStrength();
      expect(onIce.update({ away: 0, home: 0 }, true, true)).toEqual({ away: 3, home: 3 });
      expect(onIce.update({ away: 1, home: 0 }, true, true)).toEqual({ away: 3, home: 4 });
      expect(onIce.update({ away: 0, home: 0 }, true, false)).toEqual({ away: 4, home: 4 });
      expect(onIce.update({ away: 0, home: 0 }, true, true)).toEqual({ away: 3, home: 3 });
   });

   it('keeps a 5-on-3 until the next stoppage after it ends', () => {
      const onIce = new OnIceStrength();
      onIce.update({ away: 2, home: 0 }, true, true);
      expect(onIce.current).toEqual({ away: 3, home: 5 });
      expect(onIce.update({ away: 1, home: 0 }, true, false)).toEqual({ away: 4, home: 5 });
      expect(onIce.update({ away: 1, home: 0 }, true, true)).toEqual({ away: 3, home: 4 });
   });

   it('follows the penalty box directly outside 3-on-3 overtime', () => {
      const onIce = new OnIceStrength();
      expect(onIce.update({ away: 2, home: 1 }, false, false)).toEqual({ away: 3, home: 4 });
   });
});
