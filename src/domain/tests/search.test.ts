import { describe, expect, it } from 'vitest';
import { lastIndexWhere } from '@domain/search';

describe('lastIndexWhere', () => {
   const times = [0, 60, 60, 120, 300];

   it.each([
      [-1, -1],
      [0, 0],
      [59, 0],
      [60, 2],
      [200, 3],
      [300, 4],
      [Infinity, 4],
   ])('finds the last time at or before %s at index %s', (time, expected) => {
      expect(lastIndexWhere(times, (at) => at <= time)).toBe(expected);
   });

   it('returns -1 for an empty list', () => {
      expect(lastIndexWhere([], () => true)).toBe(-1);
   });
});
