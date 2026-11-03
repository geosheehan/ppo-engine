import { gameSeconds } from '@domain/clock';
import { playTime } from '@domain/plays';
import { lastIndexWhere } from '@domain/search';
import type { GameElapsed, Play, Shift } from '@domain/types';

export type TimedShift = {
   playerId: number;
   teamId: number;
   start: GameElapsed;
   end: GameElapsed;
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

export type OnIceIndex = {
   changes: GameElapsed[];
   onIce: TimedShift[][];
   startingAt: Map<GameElapsed, TimedShift[]>;
   endingAt: Map<GameElapsed, TimedShift[]>;
};

export function indexOnIce(shifts: TimedShift[]): OnIceIndex {
   const startingAt = new Map<GameElapsed, TimedShift[]>();
   const endingAt = new Map<GameElapsed, TimedShift[]>();
   for (const shift of shifts) {
      if (shift.end <= shift.start) continue;
      startingAt.set(shift.start, [...(startingAt.get(shift.start) ?? []), shift]);
      endingAt.set(shift.end, [...(endingAt.get(shift.end) ?? []), shift]);
   }

   const changes = [...new Set([...startingAt.keys(), ...endingAt.keys()])].toSorted((a, b) => a - b);
   const running = new Set<TimedShift>();
   const onIce = changes.map((time) => {
      for (const shift of endingAt.get(time) ?? []) running.delete(shift);
      for (const shift of startingAt.get(time) ?? []) running.add(shift);
      return [...running];
   });
   return { changes, onIce, startingAt, endingAt };
}

// Changes happen in the same second as the whistle, so a play at the moment it happens shows the players who were
// on when it happened, and a faceoff shows the players who came on for it.
export function onIceAt({ changes, onIce }: OnIceIndex, play: Play, time: GameElapsed, teamsYetToChange: number[] = []): TimedShift[] {
   const playAt = playTime(play);
   const atWhistle = time === playAt && !RESTARTS.includes(play.typeDescKey);
   const showsBefore = (teamId: number) => atWhistle || teamsYetToChange.includes(teamId);

   const i = lastIndexWhere(changes, (change) => change <= time);
   const after = onIce[i] ?? [];
   const before = changes[i] === time ? (onIce[i - 1] ?? []) : after;
   const shifts = [
      ...before.filter(({ teamId }) => showsBefore(teamId)),
      ...after.filter(({ teamId }) => !showsBefore(teamId)),
   ];
   return shifts.filter((shift, j) => shifts.findIndex(({ playerId }) => playerId === shift.playerId) === j);
}
