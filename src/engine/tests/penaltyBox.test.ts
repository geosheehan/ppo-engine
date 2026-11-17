import { describe, expect, it } from 'vitest';
import { PenaltyBox } from '@engine/penaltyBox';
import type { Sentence, TimedPenalty, TimelineEntry } from '@engine/types';

const minor = (eventId: number, coincidental = false): TimedPenalty => ({
   eventId,
   kind: 'minor',
   seconds: 120,
   coincidental,
});
const major = (eventId: number): TimedPenalty => ({
   eventId,
   kind: 'major',
   seconds: 300,
   coincidental: false,
});
const doubleMinor = (eventId: number): TimedPenalty[] => [
   { eventId, kind: 'minor', seconds: 120, doubleMinorHalf: 1, coincidental: false },
   { eventId, kind: 'minor', seconds: 120, doubleMinorHalf: 2, coincidental: false },
];
// Each sentence goes to its own player unless one is given.
const sentence = (penalties: TimedPenalty[], playerKey = penalties[0].eventId): Sentence => ({
   side: 'home',
   playerKey,
   penalties,
});

describe('PenaltyBox penalty clocks and queue', () => {
   it('fills the left penalty clock first, then the right', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([minor(1)]), 0);
      box.add(sentence([minor(2)]), 30);
      expect(box.runningClockCount).toBe(2);
      expect(box.expireAt(120)).toMatchObject([
         { penaltyEventId: 1, penaltyClock: 0, start: 0, end: 120 },
      ]);
   });

   it('starts a queued penalty on the first penalty clock to free up', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([minor(1)]), 0);
      box.add(sentence([minor(2)]), 30);
      box.add(sentence([minor(3)]), 60);
      box.expireAt(120);
      expect(box.runningClockCount).toBe(2);
      expect(box.expireAt(150)).toMatchObject([{ penaltyEventId: 2, penaltyClock: 1 }]);
      expect(box.expireAt(240)).toMatchObject([
         { penaltyEventId: 3, penaltyClock: 0, start: 120, end: 240 },
      ]);
   });

   it('gives a queued penalty the left penalty clock when both free up together', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([minor(1)]), 0);
      box.add(sentence([minor(2)]), 0);
      box.add(sentence([minor(3)]), 10);
      box.expireAt(120);
      expect(box.runningClockCount).toBe(1);
      expect(box.expireAt(240)).toMatchObject([{ penaltyEventId: 3, penaltyClock: 0 }]);
   });
});

describe('PenaltyBox release on a goal (Rule 16.2, Table 12)', () => {
   it('releases the minor with the least time on the clock', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([minor(1)]), 0);
      box.add(sentence([minor(2)]), 30);
      expect(box.releaseOnGoal(60, 99)).toMatchObject({
         penaltyEventId: 1,
         end: 60,
         endReason: 'goal',
         releasedByGoalId: 99,
      });
   });

   it('never releases a major', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([major(1)]), 0);
      expect(box.releaseOnGoal(60, 99)).toBeUndefined();
   });

   it('releases the minor even when a major has less time left', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([major(1)]), 0);
      box.add(sentence([minor(2)]), 250);
      expect(box.releaseOnGoal(260, 99)).toMatchObject({ penaltyEventId: 2 });
   });

   it('never releases a coincidental 4-on-4 minor', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([minor(1, true)]), 0);
      expect(box.releaseOnGoal(60, 99)).toBeUndefined();
   });

   it('A1: a goal in the first half of a double minor ends that half and starts the second', () => {
      const box = new PenaltyBox('home');
      box.add(sentence(doubleMinor(1)), 180);
      expect(box.releaseOnGoal(270, 99)).toMatchObject({
         doubleMinorHalf: 1,
         start: 180,
         end: 270,
         endReason: 'goal',
      });
      expect(box.runningClockCount).toBe(1);
      expect(box.expireAt(390)).toMatchObject([
         { doubleMinorHalf: 2, start: 270, end: 390, endReason: 'expired' },
      ]);
   });

   it('A2: a goal in the second half of a double minor ends it', () => {
      const box = new PenaltyBox('home');
      box.add(sentence(doubleMinor(1)), 180);
      box.expireAt(300);
      expect(box.releaseOnGoal(330, 99)).toMatchObject({
         doubleMinorHalf: 2,
         start: 300,
         end: 330,
      });
      expect(box.isEmpty).toBe(true);
   });

   it('B1 and B2: a major then a minor to one player; only the minor can be released', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([major(1), minor(1)]), 180);
      expect(box.releaseOnGoal(270, 98)).toBeUndefined();
      expect(box.expireAt(480)).toMatchObject([{ kind: 'major', end: 480 }]);
      expect(box.releaseOnGoal(510, 99)).toMatchObject({ kind: 'minor', start: 480, end: 510 });
   });

   it('D1: a goal releases a minor and the queued penalty starts at the goal', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([minor(15)]), 180);
      box.add(sentence([minor(23)]), 210);
      box.add(sentence([minor(6)]), 240);
      expect(box.releaseOnGoal(270, 99)).toMatchObject({ penaltyEventId: 15 });
      expect(box.releaseOnGoal(300, 98)).toMatchObject({ penaltyEventId: 23 });
      expect(box.releaseOnGoal(330, 97)).toMatchObject({ penaltyEventId: 6, start: 270, end: 330 });
   });
});

describe('PenaltyBox penalties to a player already in the box (Rules 39.2, 70.4, 75.2)', () => {
   const PLAYER = 7;

   it('adds a later minor to the end of his time, on the clock he is using', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([minor(1)], PLAYER), 0);
      box.add(sentence([minor(2)], PLAYER), 20);
      expect(box.runningClockCount).toBe(1);
      expect(box.expireAt(120)).toMatchObject([{ penaltyEventId: 1, penaltyClock: 0, end: 120 }]);
      expect(box.expireAt(240)).toMatchObject([
         { penaltyEventId: 2, penaltyClock: 0, start: 120, end: 240 },
      ]);
      expect(box.isEmpty).toBe(true);
   });

   it('adds a later minor to his queued time, behind his first penalty', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([minor(1)]), 0);
      box.add(sentence([minor(2)]), 30);
      box.add(sentence([minor(3)], PLAYER), 60);
      box.add(sentence([minor(4)], PLAYER), 90);
      expect(box.expireAt(120)).toMatchObject([{ penaltyEventId: 1 }]);
      expect(box.expireAt(150)).toMatchObject([{ penaltyEventId: 2 }]);
      expect(box.runningClockCount).toBe(1);
      expect(box.expireAt(240)).toMatchObject([{ penaltyEventId: 3, start: 120 }]);
      expect(box.expireAt(360)).toMatchObject([
         { penaltyEventId: 4, penaltyClock: 0, start: 240, end: 360 },
      ]);
   });

   it('keeps a minor added after his coincidental minor releasable', () => {
      const records: TimelineEntry[] = [];
      const box = new PenaltyBox('home', (entry) => records.push(entry));
      box.add(sentence([minor(1, true)], PLAYER), 0);
      box.add(sentence([minor(2)], PLAYER), 30);
      expect(box.releaseOnGoal(60, 99)).toBeUndefined();
      box.expireAt(120);
      expect(records.at(-1)).toMatchObject({
         kind: 'penaltyStart',
         penalty: { penaltyEventId: 2, coincidental: false },
      });
      expect(box.releaseOnGoal(150, 98)).toMatchObject({ penaltyEventId: 2, endReason: 'goal' });
   });

   it('starts the added time right away when a goal releases his minor', () => {
      const records: TimelineEntry[] = [];
      const box = new PenaltyBox('home', (entry) => records.push(entry));
      box.add(sentence([minor(1)], PLAYER), 0);
      box.add(sentence([minor(2)], PLAYER), 30);
      expect(box.releaseOnGoal(50, 99)).toMatchObject({ penaltyEventId: 1, end: 50 });
      expect(records.at(-1)).toMatchObject({
         kind: 'penaltyStart',
         time: 50,
         reason: 'nextInSentence',
         penalty: { penaltyEventId: 2, penaltyClock: 0 },
      });
      expect(box.expireAt(170)).toMatchObject([{ penaltyEventId: 2, start: 50, end: 170 }]);
   });

   it('discards a major to a player serving a minor and keeps his time', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([minor(1)], PLAYER), 0);
      expect(box.add(sentence([major(2)], PLAYER), 20)).toEqual([2]);
      expect(box.runningClockCount).toBe(1);
      expect(box.expireAt(120)).toMatchObject([{ penaltyEventId: 1 }]);
      expect(box.isEmpty).toBe(true);
   });

   it('discards both halves of a double minor to a queued player as one penalty', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([minor(1)]), 0);
      box.add(sentence([minor(2)]), 10);
      box.add(sentence([minor(3)], PLAYER), 20);
      expect(box.add(sentence(doubleMinor(4), PLAYER), 30)).toEqual([4]);
      box.expireAt(120);
      box.expireAt(130);
      expect(box.expireAt(240)).toMatchObject([{ penaltyEventId: 3 }]);
      expect(box.isEmpty).toBe(true);
   });

   it('adds the minor and discards the major when both come in one later call', () => {
      const box = new PenaltyBox('home');
      box.add(sentence([minor(1)], PLAYER), 0);
      expect(box.add(sentence([major(2), minor(3)], PLAYER), 20)).toEqual([2]);
      box.expireAt(120);
      expect(box.expireAt(240)).toMatchObject([{ penaltyEventId: 3, start: 120 }]);
   });
});
