import { describe, expect, it } from 'vitest';
import type { Play } from '@domain/types';
import { livePosition } from '@domain/playback';

const GOAL_HOLD = 7000;

const play = (typeDescKey: string, clock: string, period = 1) =>
   ({
      typeDescKey,
      typeCode: typeDescKey === 'goal' ? 505 : 0,
      timeInPeriod: clock,
      periodDescriptor: { number: period, periodType: 'REG', maxRegulationPeriods: 3 },
   }) as unknown as Play;

const at = (plays: Play[], index: number, elapsedMs: number, speed = 1) =>
   livePosition(plays, { index, time: livePositionStart(plays, index) }, elapsedMs, speed, GOAL_HOLD);

const livePositionStart = (plays: Play[], index: number): number => {
   const [mins, secs] = plays[index].timeInPeriod.split(':').map(Number);
   return (plays[index].periodDescriptor.number - 1) * 1200 + mins * 60 + secs;
};

describe('livePosition', () => {
   const plays = [play('faceoff', '00:00'), play('hit', '00:10'), play('shot-on-goal', '00:15')];

   it('runs the clock toward the next play at real time', () => {
      expect(at(plays, 0, 4500)).toEqual({ index: 0, time: 4 });
   });

   it('arrives at the next play when its time is reached', () => {
      expect(at(plays, 0, 10000)).toEqual({ index: 1, time: 10 });
   });

   it('runs faster at higher speeds', () => {
      expect(at(plays, 0, 2000, 6)).toEqual({ index: 1, time: 12 });
   });

   it('stops at the last play', () => {
      expect(at(plays, 0, 60000)).toEqual({ index: 2, time: 15 });
   });

   it('resumes from partway between two plays', () => {
      expect(livePosition(plays, { index: 0, time: 8 }, 2000, 1, GOAL_HOLD)).toEqual({ index: 1, time: 10 });
   });

   describe('plays in the same second', () => {
      const stoppage = [play('stoppage', '05:00'), play('faceoff', '05:00'), play('hit', '05:04')];

      it('holds for three seconds at real time', () => {
         expect(at(stoppage, 0, 2900)).toEqual({ index: 0, time: 300 });
         expect(at(stoppage, 0, 3000)).toEqual({ index: 1, time: 300 });
      });

      it('shortens the hold at higher speeds', () => {
         expect(at(stoppage, 0, 600, 6)).toEqual({ index: 1, time: 300 });
      });

      it('runs the clock straight on from the last play of the second', () => {
         expect(at(stoppage, 0, 5000)).toEqual({ index: 1, time: 302 });
      });
   });

   describe('goals', () => {
      const goal = [play('goal', '10:00'), play('faceoff', '10:00'), play('hit', '10:30')];

      it('holds for the goal, whatever the speed', () => {
         expect(at(goal, 0, 6900, 6)).toEqual({ index: 0, time: 600 });
         expect(at(goal, 0, 7000, 6)).toEqual({ index: 1, time: 600 });
      });
   });

   it('carries the clock across periods', () => {
      const periods = [play('period-end', '20:00'), play('period-start', '00:00', 2), play('faceoff', '00:00', 2)];
      expect(at(periods, 0, 3000)).toEqual({ index: 1, time: 1200 });
   });
});
