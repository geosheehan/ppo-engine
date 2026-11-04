import { describe, expect, it } from 'vitest';
import { indexOnIce, onIceAt } from '@domain/onIce';
import type { TimedShift } from '@domain/onIce';
import { lineChangeAt, replaySteps, stepIndexAt, stepType, teamsYetToChange } from '@domain/steps';
import type { Play } from '@domain/types';

const SEA = 55;
const TOR = 10;
const TEAM_ORDER = [TOR, SEA];

const play = (typeDescKey: string, clock: string, period = 1) =>
   ({ typeDescKey, timeInPeriod: clock, periodDescriptor: { number: period } }) as unknown as Play;

const shift = (teamId: number, start: number, end: number, playerId = 1): TimedShift => ({
   playerId,
   teamId,
   start,
   end,
});

const plays = [
   play('faceoff', '00:00'),
   play('hit', '00:40'),
   play('stoppage', '01:00'),
   play('faceoff', '01:00'),
];

describe('replaySteps', () => {
   it('gives every play a step', () => {
      expect(replaySteps(plays, [], TEAM_ORDER)).toEqual([
         { index: 0, time: 0 },
         { index: 1, time: 40 },
         { index: 2, time: 60 },
         { index: 3, time: 60 },
      ]);
   });

   it('adds a step for a change between plays, after the play before it', () => {
      const steps = replaySteps(plays, [shift(SEA, 0, 25), shift(SEA, 25, 60)], TEAM_ORDER);
      expect(steps[1]).toEqual({ index: 0, time: 25, changedTeamId: SEA });
   });

   it('leaves changes in the same second as a play to that play', () => {
      expect(replaySteps(plays, [shift(SEA, 0, 60), shift(TOR, 40, 60)], TEAM_ORDER)).toHaveLength(
         4,
      );
   });

   it('gives each team its own step when both change in the same second, away team first', () => {
      const steps = replaySteps(plays, [shift(SEA, 0, 30), shift(TOR, 0, 30)], TEAM_ORDER);
      expect(steps.filter((step) => step.changedTeamId)).toEqual([
         { index: 0, time: 30, changedTeamId: TOR },
         { index: 0, time: 30, changedTeamId: SEA },
      ]);
   });

   it('keeps changes a second apart as separate steps', () => {
      const steps = replaySteps(plays, [shift(SEA, 0, 30), shift(SEA, 0, 31)], TEAM_ORDER);
      expect(steps.filter((step) => step.changedTeamId).map(({ time }) => time)).toEqual([30, 31]);
   });
});

describe('stepIndexAt', () => {
   const steps = replaySteps(
      plays,
      [shift(SEA, 0, 25), shift(SEA, 25, 60), shift(TOR, 0, 25)],
      TEAM_ORDER,
   );

   it('finds a play step', () => {
      expect(stepIndexAt(steps, { index: 1, time: 40 })).toBe(3);
   });

   it("finds each team's change step in a shared second", () => {
      expect(stepIndexAt(steps, { index: 0, time: 25, changedTeamId: TOR })).toBe(1);
      expect(stepIndexAt(steps, { index: 0, time: 25, changedTeamId: SEA })).toBe(2);
   });

   it('finds the latest step while the live clock runs between them', () => {
      expect(stepIndexAt(steps, { index: 0, time: 30 })).toBe(2);
   });

   it('tells plays in the same second apart', () => {
      expect(stepIndexAt(steps, { index: 2, time: 60 })).toBe(4);
      expect(stepIndexAt(steps, { index: 3, time: 60 })).toBe(5);
   });
});

describe('teamsYetToChange', () => {
   const shifts = [
      shift(TOR, 0, 25, 1),
      shift(TOR, 25, 60, 2),
      shift(SEA, 0, 25, 3),
      shift(SEA, 25, 60, 4),
   ];
   const steps = replaySteps(plays, shifts, TEAM_ORDER);

   it("holds the home team's old line on the away team's change step", () => {
      const awayStep = stepIndexAt(steps, { index: 0, time: 25, changedTeamId: TOR });
      expect(teamsYetToChange(steps, awayStep)).toEqual([SEA]);
      expect(
         onIceAt(indexOnIce(shifts), plays[0], 25, teamsYetToChange(steps, awayStep))
            .map(({ playerId }) => playerId)
            .sort(),
      ).toEqual([2, 3]);
   });

   it('shows both new lines once the home team has changed too', () => {
      const homeStep = stepIndexAt(steps, { index: 0, time: 25, changedTeamId: SEA });
      expect(teamsYetToChange(steps, homeStep)).toEqual([]);
      expect(
         onIceAt(indexOnIce(shifts), plays[0], 25, [])
            .map(({ playerId }) => playerId)
            .sort(),
      ).toEqual([2, 4]);
   });
});

describe('lineChangeAt', () => {
   it('lists who came off and who went on for one team', () => {
      const shifts = [
         shift(SEA, 0, 25, 1),
         shift(SEA, 0, 25, 2),
         shift(SEA, 25, 60, 3),
         shift(TOR, 25, 60, 4),
      ];
      expect(lineChangeAt(indexOnIce(shifts), SEA, 25)).toEqual({ off: [1, 2], on: [3] });
   });

   it('leaves out a player whose shift record just splits at that second', () => {
      const shifts = [shift(SEA, 0, 25, 1), shift(SEA, 25, 60, 1), shift(SEA, 25, 60, 2)];
      expect(lineChangeAt(indexOnIce(shifts), SEA, 25)).toEqual({ off: [], on: [2] });
   });
});

describe('stepType', () => {
   it('names a change step as a line change and a play step by its play', () => {
      expect(stepType({ index: 0, time: 25, changedTeamId: SEA }, [play('faceoff', '00:00')])).toBe(
         'line-change',
      );
      expect(stepType({ index: 0, time: 0 }, [play('faceoff', '00:00')])).toBe('faceoff');
   });
});
