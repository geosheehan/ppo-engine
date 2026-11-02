import { gameSeconds } from '@domain/clock';
import type { ReplayPosition } from '@domain/playback';
import type { TimedShift } from '@domain/onIce';
import type { Play } from '@domain/types';

export type ReplayStep = ReplayPosition & {
   changedTeamIds?: number[];
};

export const LINE_CHANGE = 'line-change';

export const stepType = (step: ReplayStep, plays: Play[]): string =>
   step.changedTeamIds ? LINE_CHANGE : plays[step.index].typeDescKey;

export function replaySteps(plays: Play[], shifts: TimedShift[]): ReplayStep[] {
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
      if (index !== -1) changeSteps.push({ index, time, changedTeamIds: [...teamIds] });
   }

   return [...playSteps, ...changeSteps].toSorted((a, b) => a.time - b.time || a.index - b.index);
}

export const stepIndexAt = (steps: ReplayStep[], { index, time }: ReplayPosition): number =>
   steps.findLastIndex((step) => step.time < time || (step.time === time && step.index <= index));
