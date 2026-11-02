import { describe, expect, it } from 'vitest';
import type { TimedShift } from '@domain/onIce';
import { replaySteps, stepIndexAt, stepType } from '@domain/steps';
import type { Play } from '@domain/types';

const SEA = 55;
const TOR = 10;

const play = (typeDescKey: string, clock: string, period = 1) =>
   ({ typeDescKey, timeInPeriod: clock, periodDescriptor: { number: period } }) as unknown as Play;

const shift = (teamId: number, start: number, end: number): TimedShift => ({ playerId: 1, teamId, start, end });

describe('replaySteps', () => {
   const plays = [play('faceoff', '00:00'), play('hit', '00:40'), play('stoppage', '01:00'), play('faceoff', '01:00')];

   it('gives every play a step', () => {
      expect(replaySteps(plays, [])).toEqual([
         { index: 0, time: 0 },
         { index: 1, time: 40 },
         { index: 2, time: 60 },
         { index: 3, time: 60 },
      ]);
   });

   it('adds a step for a change between plays, after the play before it', () => {
      const steps = replaySteps(plays, [shift(SEA, 0, 25), shift(SEA, 25, 60)]);
      expect(steps[1]).toEqual({ index: 0, time: 25, changedTeamIds: [SEA] });
   });

   it('leaves changes in the same second as a play to that play', () => {
      expect(replaySteps(plays, [shift(SEA, 0, 60), shift(TOR, 40, 60)])).toHaveLength(4);
   });

   it('groups both teams changing in the same second into one step', () => {
      const steps = replaySteps(plays, [shift(SEA, 0, 30), shift(TOR, 0, 30)]);
      expect(steps.filter((step) => step.changedTeamIds)).toEqual([{ index: 0, time: 30, changedTeamIds: [SEA, TOR] }]);
   });

   it('keeps changes a second apart as separate steps', () => {
      const steps = replaySteps(plays, [shift(SEA, 0, 30), shift(SEA, 0, 31)]);
      expect(steps.filter((step) => step.changedTeamIds).map(({ time }) => time)).toEqual([30, 31]);
   });
});

describe('stepIndexAt', () => {
   const plays = [play('faceoff', '00:00'), play('hit', '00:40'), play('stoppage', '01:00'), play('faceoff', '01:00')];
   const steps = replaySteps(plays, [shift(SEA, 0, 25), shift(SEA, 25, 60)]);

   it('finds a play step', () => {
      expect(stepIndexAt(steps, { index: 1, time: 40 })).toBe(2);
   });

   it('finds a change step', () => {
      expect(stepIndexAt(steps, { index: 0, time: 25 })).toBe(1);
   });

   it('finds the latest step while the live clock runs between them', () => {
      expect(stepIndexAt(steps, { index: 0, time: 30 })).toBe(1);
   });

   it('tells plays in the same second apart', () => {
      expect(stepIndexAt(steps, { index: 2, time: 60 })).toBe(3);
      expect(stepIndexAt(steps, { index: 3, time: 60 })).toBe(4);
   });
});

describe('stepType', () => {
   it('names a change step as a line change and a play step by its play', () => {
      expect(stepType({ index: 0, time: 25, changedTeamIds: [SEA] }, [play('faceoff', '00:00')])).toBe('line-change');
      expect(stepType({ index: 0, time: 0 }, [play('faceoff', '00:00')])).toBe('faceoff');
   });
});
