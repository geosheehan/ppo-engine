import { describe, expect, it } from 'vitest';
import { AWAY, engineFor, goal, HOME, penalty } from '@engine/tests/fixtures';

describe('PlayGroup: a goal on a delayed penalty', () => {
   it('washes out a delayed minor', () => {
      const called = penalty(HOME, '05:00', 2);
      const result = engineFor(goal(AWAY, '05:00'), called);
      expect(result.goals[0].washedPenaltyId).toBe(called.eventId);
      expect(result.servedPenalties).toEqual([]);
      expect(result.strengthIntervals.every((interval) => interval.home === 5)).toBe(true);
   });

   it('washes out a delayed minor recorded before the goal', () => {
      const called = penalty(HOME, '05:00', 2);
      const result = engineFor(called, goal(AWAY, '05:00'));
      expect(result.goals[0].washedPenaltyId).toBe(called.eventId);
      expect(result.servedPenalties).toEqual([]);
   });

   it('serves the delayed minor when the goal releases one that was already running', () => {
      const running = penalty(HOME, '02:00', 2);
      const called = penalty(HOME, '03:00', 2);
      const result = engineFor(running, goal(AWAY, '03:00'), called);
      expect(result.goals[0].washedPenaltyId).toBeUndefined();
      expect(result.servedPenalties).toMatchObject([
         { penaltyEventId: running.eventId, start: 120, end: 180, endReason: 'goal' },
         { penaltyEventId: called.eventId, start: 180, end: 300 },
      ]);
   });

   it('washes out the first half of a delayed double minor (Rule 18.2)', () => {
      const called = penalty(HOME, '05:00', 4);
      const result = engineFor(goal(AWAY, '05:00'), called);
      expect(result.goals[0].washedPenaltyId).toBe(called.eventId);
      expect(result.servedPenalties).toMatchObject([
         { penaltyEventId: called.eventId, doubleMinorHalf: 2, start: 300, end: 420 },
      ]);
   });

   it('serves a delayed double minor in full when the goal releases a running minor', () => {
      const running = penalty(HOME, '02:00', 2);
      const called = penalty(HOME, '03:00', 4);
      const result = engineFor(running, goal(AWAY, '03:00'), called);
      expect(result.servedPenalties).toMatchObject([
         { penaltyEventId: running.eventId, endReason: 'goal' },
         { penaltyEventId: called.eventId, doubleMinorHalf: 1, start: 180, end: 300 },
         { penaltyEventId: called.eventId, doubleMinorHalf: 2, start: 300, end: 420 },
      ]);
   });

   it('serves a delayed major in full, and the goal is not scored on a power play', () => {
      const called = penalty(HOME, '05:00', 5, 'MAJ');
      const result = engineFor(goal(AWAY, '05:00'), called);
      expect(result.goals[0]).toMatchObject({ strength: { away: 5, home: 5 } });
      expect(result.goals[0].washedPenaltyId).toBeUndefined();
      expect(result.servedPenalties).toMatchObject([
         { penaltyEventId: called.eventId, kind: 'major', start: 300, end: 600 },
      ]);
   });

   it("washes nothing when both teams are penalized in the goal's second", () => {
      const result = engineFor(
         goal(AWAY, '05:00'),
         penalty(HOME, '05:00', 2),
         penalty(AWAY, '05:00', 2),
      );
      expect(result.goals[0].washedPenaltyId).toBeUndefined();
      expect(result.servedPenalties).toHaveLength(2);
      expect(result.servedPenalties.every((served) => served.coincidental)).toBe(true);
   });
});

describe('PlayGroup: penalty-shot goals', () => {
   it('reads a penalty shot from the situation code and releases nothing', () => {
      const running = penalty(HOME, '02:00', 2);
      const result = engineFor(running, goal(AWAY, '03:00', '0101'));
      expect(result.goals[0].penaltyShot).toBe(true);
      expect(result.servedPenalties).toMatchObject([{ penaltyEventId: running.eventId, end: 240 }]);
   });

   it('falls back to a PS penalty in the same second when the goal has no situation code', () => {
      const running = penalty(HOME, '02:00', 2);
      const result = engineFor(running, penalty(HOME, '03:00', 0, 'PS'), goal(AWAY, '03:00'));
      expect(result.goals[0].penaltyShot).toBe(true);
      expect(result.servedPenalties).toMatchObject([{ penaltyEventId: running.eventId, end: 240 }]);
   });

   it("is not fooled by a regular goal's situation code", () => {
      const running = penalty(HOME, '02:00', 2);
      const result = engineFor(running, goal(AWAY, '03:00', '1451'));
      expect(result.goals[0].penaltyShot).toBe(false);
      expect(result.servedPenalties).toMatchObject([
         { penaltyEventId: running.eventId, end: 180, endReason: 'goal' },
      ]);
   });
});
