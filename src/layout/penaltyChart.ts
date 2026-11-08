import { secondsToClock } from '@domain/clock';
import { PERIOD_SECONDS } from '@domain/constants';
import type { GameElapsed } from '@domain/types';

// The axis breakpoints plus every other moment the chart marks, in game order and within the game.
export function chartMoments(breakpoints: GameElapsed[], times: GameElapsed[]): GameElapsed[] {
   const gameEnd = breakpoints.at(-1) ?? 0;
   return [...new Set([...breakpoints, ...times])]
      .filter((time) => time <= gameEnd)
      .toSorted((a, b) => a - b);
}

// A moment on a period boundary belongs to the period before it, so a penalty that runs out the period ends at
// 20:00 rather than at 0:00 of the next.
export const momentPeriod = (time: GameElapsed): number =>
   Math.max(1, Math.ceil(time / PERIOD_SECONDS));

export const momentClock = (time: GameElapsed): string =>
   secondsToClock(time - (momentPeriod(time) - 1) * PERIOD_SECONDS);

// Penalties (and goals, as zero-length spans) that share a time form one group, so a penalty's start and end labels
// sit on the same row. A group only splits where two of its own labels are closer than `gap`. Each piece then
// takes the first row whose last label is at least `gap` behind it.
export function labelRows(
   spans: [GameElapsed, GameElapsed][],
   x: (time: GameElapsed) => number,
   gap: number,
): Map<GameElapsed, number> {
   let groups: Set<GameElapsed>[] = [];
   for (const span of spans) {
      const touching = groups.filter((group) => span.some((time) => group.has(time)));
      groups = groups.filter((group) => !touching.includes(group));
      groups.push(new Set([...span, ...touching.flatMap((group) => [...group])]));
   }

   const pieces = groups
      .flatMap((group) => {
         const times = [...group].toSorted((a, b) => a - b);
         const split: GameElapsed[][] = [[times[0]]];
         for (const [i, time] of times.slice(1).entries()) {
            if (x(time) - x(times[i]) < gap) split.push([time]);
            else split.at(-1)?.push(time);
         }
         return split;
      })
      .toSorted((a, b) => a[0] - b[0]);

   const rowEnds: number[] = [];
   const rows = new Map<GameElapsed, number>();
   for (const piece of pieces) {
      const free = rowEnds.findIndex((end) => x(piece[0]) - end >= gap);
      const row = free === -1 ? rowEnds.length : free;
      rowEnds[row] = x(piece.at(-1) ?? piece[0]);
      for (const time of piece) rows.set(time, row);
   }
   return rows;
}
