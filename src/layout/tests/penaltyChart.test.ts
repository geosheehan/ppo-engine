import { describe, expect, it } from 'vitest';
import { chartMoments, momentClock, momentPeriod } from '@layout/penaltyChart';
import type { ServedPenalty } from '@engine/types';

const served = (start: number, end: number) => ({ start, end }) as ServedPenalty;

describe('chartMoments', () => {
   it('lists each start and end once, in game order', () => {
      expect(
         chartMoments([
            served(1520, 1640),
            served(1056, 1176),
            served(1440, 1560),
            served(1440, 1560),
         ]),
      ).toEqual([1056, 1176, 1440, 1520, 1560, 1640]);
   });
});

describe('momentPeriod and momentClock', () => {
   it('labels a moment inside a period by that period', () => {
      expect([momentPeriod(1056), momentClock(1056)]).toEqual([1, '17:36']);
      expect([momentPeriod(1279), momentClock(1279)]).toEqual([2, '1:19']);
   });

   it('labels the opening faceoff as the start of the first period', () => {
      expect([momentPeriod(0), momentClock(0)]).toEqual([1, '0:00']);
   });

   it('labels a period boundary as the end of the period before it', () => {
      expect([momentPeriod(1200), momentClock(1200)]).toEqual([1, '20:00']);
      expect([momentPeriod(3600), momentClock(3600)]).toEqual([3, '20:00']);
   });
});
