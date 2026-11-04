import { describe, expect, it } from 'vitest';
import { indexOnIce, onIceAt, timedShifts } from '@domain/onIce';
import type { Play, Shift } from '@domain/types';

const play = (typeDescKey: string, clock: string, period = 1) =>
   ({ typeDescKey, timeInPeriod: clock, periodDescriptor: { number: period } }) as unknown as Play;

const shift = (
   playerId: number,
   start: string,
   end: string,
   period = 1,
   typeCode = 517,
): Shift => ({ playerId, teamId: 1, period, startTime: start, endTime: end, typeCode });

const ids = (shifts: { playerId: number }[]) => shifts.map(({ playerId }) => playerId).sort();

describe('timedShifts', () => {
   it('converts shift times to game seconds', () => {
      expect(timedShifts([shift(1, '00:45', '01:15', 2)])).toEqual([
         { playerId: 1, teamId: 1, start: 1245, end: 1275 },
      ]);
   });

   it('drops goal rows', () => {
      expect(timedShifts([shift(1, '17:48', '17:48', 1, 505)])).toEqual([]);
   });
});

describe('onIceAt', () => {
   // Player 1 goes off at the 17:48 whistle and player 2 comes on for the faceoff.
   const shifts = indexOnIce(
      timedShifts([
         shift(1, '17:00', '17:48'),
         shift(2, '17:48', '18:30'),
         shift(3, '00:00', '20:00'),
      ]),
   );
   const whistle = 17 * 60 + 48;

   it('shows who was on for a play at the whistle', () => {
      expect(ids(onIceAt(shifts, play('goal', '17:48'), whistle))).toEqual([1, 3]);
   });

   it('shows who came on for the faceoff', () => {
      expect(ids(onIceAt(shifts, play('faceoff', '17:48'), whistle))).toEqual([2, 3]);
   });

   it('shows who is on while the clock runs between plays', () => {
      expect(ids(onIceAt(shifts, play('faceoff', '17:48'), whistle + 10))).toEqual([2, 3]);
   });

   it("shows the new period's players at its start", () => {
      const periods = indexOnIce(
         timedShifts([shift(1, '19:00', '20:00'), shift(2, '00:00', '00:40', 2)]),
      );
      expect(ids(onIceAt(periods, play('period-end', '20:00'), 1200))).toEqual([1]);
      expect(ids(onIceAt(periods, play('period-start', '00:00', 2), 1200))).toEqual([2]);
   });

   it('lists a player once when their shifts overlap', () => {
      const overlapping = indexOnIce(
         timedShifts([shift(1, '05:00', '06:00'), shift(1, '05:30', '06:10')]),
      );
      expect(ids(onIceAt(overlapping, play('hit', '05:00'), 340))).toEqual([1]);
   });
});
