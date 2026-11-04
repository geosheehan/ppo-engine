import { describe, expect, it } from 'vitest';
import { descKeyToLabel, periodLabel, playPeriodLabel } from '@domain/labels';
import type { PeriodType, Play } from '@domain/types';

const playIn = (number: number, periodType: PeriodType) =>
   ({ periodDescriptor: { number, periodType, maxRegulationPeriods: 3 } }) as Play;

describe('descKeyToLabel', () => {
   it('turns a desc key into sentence case', () => {
      expect(descKeyToLabel('some-new-penalty')).toBe('Some new penalty');
   });
});

describe('periodLabel', () => {
   it('labels regulation periods P1 to P3', () => {
      expect([1, 2, 3].map((period) => periodLabel(period, 3))).toEqual(['P1', 'P2', 'P3']);
   });

   it('labels the first overtime OT and numbers the rest', () => {
      expect([4, 5, 6].map((period) => periodLabel(period, 3))).toEqual(['OT', '2OT', '3OT']);
   });
});

describe('playPeriodLabel', () => {
   it('labels a regular-season game P1 to P3, OT, then SO', () => {
      expect(
         [playIn(1, 'REG'), playIn(3, 'REG'), playIn(4, 'OT'), playIn(5, 'SO')].map(
            playPeriodLabel,
         ),
      ).toEqual(['P1', 'P3', 'OT', 'SO']);
   });

   it('numbers playoff overtimes', () => {
      expect([playIn(4, 'OT'), playIn(5, 'OT'), playIn(7, 'OT')].map(playPeriodLabel)).toEqual([
         'OT',
         '2OT',
         '4OT',
      ]);
   });
});
