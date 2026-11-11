import { describe, expect, it } from 'vitest';
import { sumTotals } from '@engine/totals';

describe('sumTotals', () => {
   it('adds goals, opportunities and seconds across strengths', () => {
      expect(
         sumTotals([
            { label: '5v4', goals: 1, opportunities: 3, seconds: 240 },
            { label: '5v3', goals: 1, opportunities: 1, seconds: 45 },
            { label: '4v3', goals: 0, opportunities: 1, seconds: 30 },
         ]),
      ).toEqual({ goals: 2, opportunities: 5, seconds: 315 });
   });

   it('is all zeros without any power plays', () => {
      expect(sumTotals([])).toEqual({ goals: 0, opportunities: 0, seconds: 0 });
   });
});
