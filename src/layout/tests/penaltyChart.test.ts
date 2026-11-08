import { describe, expect, it } from 'vitest';
import { chartMoments, labelRows, momentClock, momentPeriod } from '@layout/penaltyChart';

describe('chartMoments', () => {
   it('merges each moment into the breakpoints once, in game order', () => {
      expect(
         chartMoments(
            [0, 1056, 1176, 1200, 2400],
            [1520, 1640, 1056, 1176, 1440, 1560, 1440, 1560],
         ),
      ).toEqual([0, 1056, 1176, 1200, 1440, 1520, 1560, 1640, 2400]);
   });

   it('drops moments after the game ends', () => {
      expect(chartMoments([0, 3600], [3550, 3670])).toEqual([0, 3550, 3600]);
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

describe('labelRows', () => {
   const rowsOf = (spans: [number, number][]) => Object.fromEntries(labelRows(spans, (t) => t, 5));

   it("keeps a penalty's start and end on one row", () => {
      expect(
         rowsOf([
            [0, 65],
            [65, 185],
            [188, 345],
         ]),
      ).toEqual({ 0: 0, 65: 0, 185: 0, 188: 1, 345: 1 });
   });

   it('stacks overlapping penalties and reuses a row once it is clear', () => {
      expect(
         rowsOf([
            [0, 120],
            [60, 180],
            [130, 250],
         ]),
      ).toEqual({
         0: 0,
         120: 0,
         60: 1,
         180: 1,
         130: 0,
         250: 0,
      });
   });

   it('groups a goal with the penalty it ends', () => {
      expect(
         rowsOf([
            [0, 120],
            [50, 50],
            [100, 100],
         ]),
      ).toEqual({ 0: 0, 120: 0, 50: 1, 100: 1 });
   });

   it('splits a group only where its own labels would overlap', () => {
      expect(
         rowsOf([
            [0, 3],
            [3, 3],
         ]),
      ).toEqual({ 0: 0, 3: 1 });
   });
});
