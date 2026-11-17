import { describe, expect, it } from 'vitest';
import { linkedEvents } from '@layout/linkedEvents';
import type { GoalEffect } from '@engine/types';

const goal = (goalEventId: number, released?: number, washed?: number): GoalEffect => ({
   goalEventId,
   side: 'home',
   strength: { away: 4, home: 5 },
   penaltyShot: false,
   releasedPenaltyEventId: released,
   washedPenaltyId: washed,
});

describe('linkedEvents', () => {
   const goals = [goal(10, 1), goal(11, undefined, 2), goal(12)];

   it('is empty when nothing is picked', () => {
      expect([...linkedEvents(goals, undefined)]).toEqual([]);
   });

   it('links a penalty to the goal that released or washed it', () => {
      expect([...linkedEvents(goals, 1)]).toEqual([1, 10]);
      expect([...linkedEvents(goals, 2)]).toEqual([2, 11]);
   });

   it('links a goal to the penalty it released or washed', () => {
      expect([...linkedEvents(goals, 10)]).toEqual([10, 1]);
      expect([...linkedEvents(goals, 11)]).toEqual([11, 2]);
   });

   it('keeps a goal that touched no penalty on its own', () => {
      expect([...linkedEvents(goals, 12)]).toEqual([12]);
   });
});
