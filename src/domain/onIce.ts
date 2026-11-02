import { gameSeconds } from '@domain/clock';
import type { Play, Shift } from '@domain/types';

export type TimedShift = {
   playerId: number;
   teamId: number;
   start: number;
   end: number;
};

const SHIFT_TYPE_CODE = 517;
const RESTARTS = ['faceoff', 'period-start'];

export const timedShifts = (shifts: Shift[]): TimedShift[] =>
   shifts
      .filter((shift) => shift.typeCode === SHIFT_TYPE_CODE)
      .map(({ playerId, teamId, period, startTime, endTime }) => ({
         playerId,
         teamId,
         start: gameSeconds(period, startTime),
         end: gameSeconds(period, endTime),
      }));

// Changes happen in the same second as the whistle, so a play at the moment it happens shows the players who were
// on when it happened, and a faceoff shows the players who came on for it.
export function onIceAt(shifts: TimedShift[], play: Play, time: number): TimedShift[] {
   const playAt = gameSeconds(play.periodDescriptor.number, play.timeInPeriod);
   const atWhistle = time === playAt && !RESTARTS.includes(play.typeDescKey);
   const onIce = shifts.filter(({ start, end }) => (atWhistle ? start < time && time <= end : start <= time && time < end));
   return onIce.filter((shift, i) => onIce.findIndex(({ playerId }) => playerId === shift.playerId) === i);
}
