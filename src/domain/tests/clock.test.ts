import { describe, expect, it } from 'vitest';
import { clockToSeconds, maskClock } from '@domain/clock';

describe('maskClock', () => {
   it('fills the clock from the right', () => {
      expect(maskClock('4')).toBe('0:04');
      expect(maskClock('43')).toBe('0:43');
      expect(maskClock('435')).toBe('4:35');
      expect(maskClock('1235')).toBe('12:35');
   });

   it('re-reads a typed or reformatted clock as digits', () => {
      expect(maskClock('4:35')).toBe('4:35');
      expect(maskClock('4:355')).toBe('43:55');
      expect(maskClock('0:043')).toBe('0:43');
   });

   it('keeps the last four digits', () => {
      expect(maskClock('12359')).toBe('23:59');
   });

   it('reads nothing as 0:00', () => {
      expect(maskClock('')).toBe('0:00');
      expect(maskClock('ab')).toBe('0:00');
   });

   it('leaves seconds past 59 for clockToSeconds to carry', () => {
      expect(clockToSeconds(maskClock('75'))).toBe(75);
   });
});
