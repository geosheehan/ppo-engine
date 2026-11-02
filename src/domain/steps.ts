import { gameSeconds } from '@domain/clock';
import type { ReplayPosition } from '@domain/playback';
import type { TimedShift } from '@domain/onIce';
import type { Play } from '@domain/types';

export type ReplayStep = ReplayPosition;

export const LINE_CHANGE = 'line-change';

export const stepType = (step: ReplayStep, plays: Play[]): string =>
   step.changedTeamId ? LINE_CHANGE : plays[step.index].typeDescKey;

export function replaySteps(plays: Play[], shifts: TimedShift[], teamOrder: number[]): ReplayStep[] {
   const playSteps: ReplayStep[] = plays.map((play, index) => ({
      index,
      time: gameSeconds(play.periodDescriptor.number, play.timeInPeriod),
   }));
   const playTimes = new Set(playSteps.map(({ time }) => time));

   const changedTeams = new Map<number, Set<number>>();
   for (const { teamId, start, end } of shifts) {
      for (const time of [start, end]) {
         if (playTimes.has(time)) continue;
         changedTeams.set(time, (changedTeams.get(time) ?? new Set()).add(teamId));
      }
   }

   const changeSteps: ReplayStep[] = [];
   for (const [time, teamIds] of changedTeams) {
      const index = playSteps.findLastIndex((step) => step.time < time);
      if (index === -1) continue;
      for (const changedTeamId of [...teamIds].toSorted((a, b) => teamOrder.indexOf(a) - teamOrder.indexOf(b))) {
         changeSteps.push({ index, time, changedTeamId });
      }
   }

   const order = (step: ReplayStep): number => (step.changedTeamId ? teamOrder.indexOf(step.changedTeamId) : -1);
   return [...playSteps, ...changeSteps].toSorted((a, b) => a.time - b.time || a.index - b.index || order(a) - order(b));
}

export function stepIndexAt(steps: ReplayStep[], { index, time, changedTeamId }: ReplayPosition): number {
   if (changedTeamId) return steps.findIndex((step) => step.time === time && step.changedTeamId === changedTeamId);
   return steps.findLastIndex((step) => step.time < time || (step.time === time && step.index <= index));
}

export type LineChange = {
   off: number[];
   on: number[];
};

export function lineChangeAt(shifts: TimedShift[], teamId: number, time: number): LineChange {
   const team = shifts.filter((shift) => shift.teamId === teamId);
   const off = team.filter(({ end }) => end === time).map(({ playerId }) => playerId);
   const on = team.filter(({ start }) => start === time).map(({ playerId }) => playerId);
   return { off: off.filter((id) => !on.includes(id)), on: on.filter((id) => !off.includes(id)) };
}

export const teamsYetToChange =(steps: ReplayStep[], stepIndex: number): number[] =>
   steps
      .filter((step, i) => i > stepIndex && step.time === steps[stepIndex].time && step.changedTeamId)
      .map(({ changedTeamId }) => changedTeamId!);
