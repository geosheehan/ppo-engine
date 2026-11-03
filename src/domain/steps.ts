import type { ReplayPosition } from '@domain/playback';
import type { OnIceIndex, TimedShift } from '@domain/onIce';
import { playTime } from '@domain/plays';
import { lastIndexWhere } from '@domain/search';
import type { GameElapsed, Play } from '@domain/types';

export type ReplayStep = ReplayPosition;

export const LINE_CHANGE = 'line-change';

export const stepType = (step: ReplayStep, plays: Play[]): string =>
   step.changedTeamId ? LINE_CHANGE : plays[step.index].typeDescKey;

export function replaySteps(plays: Play[], shifts: TimedShift[], teamOrder: number[]): ReplayStep[] {
   const playSteps: ReplayStep[] = plays.map((play, index) => ({
      index,
      time: playTime(play),
   }));
   const playTimes = new Set(playSteps.map(({ time }) => time));

   const changedTeams = new Map<GameElapsed, Set<number>>();
   for (const { teamId, start, end } of shifts) {
      for (const time of [start, end]) {
         if (playTimes.has(time)) continue;
         changedTeams.set(time, (changedTeams.get(time) ?? new Set()).add(teamId));
      }
   }

   const changeSteps: ReplayStep[] = [];
   for (const [time, teamIds] of changedTeams) {
      const index = lastIndexWhere(playSteps, (step) => step.time < time);
      if (index === -1) continue;
      for (const changedTeamId of [...teamIds].toSorted((a, b) => teamOrder.indexOf(a) - teamOrder.indexOf(b))) {
         changeSteps.push({ index, time, changedTeamId });
      }
   }

   const order = (step: ReplayStep): number => (step.changedTeamId ? teamOrder.indexOf(step.changedTeamId) : -1);
   return [...playSteps, ...changeSteps].toSorted((a, b) => a.time - b.time || a.index - b.index || order(a) - order(b));
}

export function stepIndexAt(steps: ReplayStep[], { index, time, changedTeamId }: ReplayPosition): number {
   if (changedTeamId) {
      for (let i = lastIndexWhere(steps, (step) => step.time < time) + 1; steps[i]?.time === time; i++) {
         if (steps[i].changedTeamId === changedTeamId) return i;
      }
      return -1;
   }
   return lastIndexWhere(steps, (step) => step.time < time || (step.time === time && step.index <= index));
}

export type LineChange = {
   off: number[];
   on: number[];
};

export function lineChangeAt({ startingAt, endingAt }: OnIceIndex, teamId: number, time: GameElapsed): LineChange {
   const playersOf = (shifts: TimedShift[] = []) => shifts.filter((shift) => shift.teamId === teamId).map(({ playerId }) => playerId);
   const off = playersOf(endingAt.get(time));
   const on = playersOf(startingAt.get(time));
   return { off: off.filter((id) => !on.includes(id)), on: on.filter((id) => !off.includes(id)) };
}

export function teamsYetToChange(steps: ReplayStep[], stepIndex: number): number[] {
   const teams: number[] = [];
   for (let i = stepIndex + 1; steps[i]?.time === steps[stepIndex].time; i++) {
      const { changedTeamId } = steps[i];
      if (changedTeamId) teams.push(changedTeamId);
   }
   return teams;
}
