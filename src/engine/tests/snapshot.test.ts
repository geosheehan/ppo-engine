import { describe, expect, it } from 'vitest';
import type { PenaltyPlay } from '@domain/types';
import { snapshotAt } from '@engine/snapshot';
import type { PenaltyEngineResult, ServedPenalty } from '@engine/types';

const penaltyPlay = (eventId: number, timeInPeriod: string, duration: number) => ({
   eventId,
   typeCode: 509,
   typeDescKey: 'penalty',
   sortOrder: eventId,
   periodDescriptor: { number: 1, periodType: 'REG', maxRegulationPeriods: 3 },
   timeInPeriod,
   details: { typeCode: duration === 5 ? 'MAJ' : 'MIN', duration },
}) as unknown as PenaltyPlay;

const served = (overrides: Partial<ServedPenalty>): ServedPenalty => ({
   penaltyEventId: 1,
   side: 'home',
   penaltyClock: 0,
   kind: 'minor',
   start: 970,
   end: 1065,
   endReason: 'goal',
   coincidental: false,
   ...overrides,
});

const plays = (...list: PenaltyPlay[]) => new Map(list.map((play) => [play.eventId, play]));

// A home minor called at 16:10 of the 1st (970 s) and released by a goal at 17:45 (1065 s).
const releasedMinor: PenaltyEngineResult = {
   timeline: [],
   servedPenalties: [served({})],
   strengthIntervals: [{ away: 5, home: 4, start: 970, end: 1065 }],
   goals: [],
};

describe('snapshotAt', () => {
   it('counts down from the full length, not from the early release', () => {
      const snapshot = snapshotAt(releasedMinor, plays(penaltyPlay(1, '16:10', 2)), 1025);
      expect(snapshot.onClock).toMatchObject([{ served: { penaltyEventId: 1 }, remaining: 65 }]);
   });

   it('takes a penalty off the clock at the moment it ended', () => {
      expect(snapshotAt(releasedMinor, plays(penaltyPlay(1, '16:10', 2)), 1065).onClock).toEqual([]);
   });

   it('reads strength from the interval and falls back to 5v5', () => {
      const penaltyPlays = plays(penaltyPlay(1, '16:10', 2));
      expect(snapshotAt(releasedMinor, penaltyPlays, 1000).strength).toEqual({ away: 5, home: 4 });
      expect(snapshotAt(releasedMinor, penaltyPlays, 1065).strength).toEqual({ away: 5, home: 5 });
   });

   it('finds the strength among several intervals, including at their edges', () => {
      const result: PenaltyEngineResult = {
         timeline: [],
         servedPenalties: [],
         strengthIntervals: [
            { away: 5, home: 5, start: 0, end: 60 },
            { away: 5, home: 4, start: 60, end: 120 },
            { away: 5, home: 3, start: 120, end: 150 },
            { away: 5, home: 4, start: 150, end: 240 },
         ],
         goals: [],
      };
      const strengthAt = (time: number) => snapshotAt(result, plays(), time).strength;
      expect([0, 59, 60, 119, 120, 149, 150, 239, 240].map(strengthAt).map(({ away, home }) => `${away}v${home}`))
         .toEqual(['5v5', '5v5', '5v4', '5v4', '5v3', '5v3', '5v4', '5v4', '5v5']);
   });

   it('lists a called penalty as queued until a penalty clock frees up', () => {
      // Called at 16:10 but waits until 18:10 (1090 s) for a clock.
      const result: PenaltyEngineResult = {
         timeline: [],
         servedPenalties: [served({ start: 1090, end: 1210, endReason: 'expired' })],
         strengthIntervals: [],
         goals: [],
      };
      const penaltyPlays = plays(penaltyPlay(1, '16:10', 2));
      expect(snapshotAt(result, penaltyPlays, 960).queued).toEqual([]);
      expect(snapshotAt(result, penaltyPlays, 1000).queued).toMatchObject([{ served: { penaltyEventId: 1 } }]);
      expect(snapshotAt(result, penaltyPlays, 1090)).toMatchObject({ queued: [], onClock: [{ remaining: 120 }] });
   });

   it('shows the whole double minor on the clock during its first half', () => {
      const result: PenaltyEngineResult = {
         timeline: [],
         servedPenalties: [
            served({ doubleMinorHalf: 1, start: 970, end: 1090, endReason: 'expired' }),
            served({ doubleMinorHalf: 2, start: 1090, end: 1210, endReason: 'expired' }),
         ],
         strengthIntervals: [],
         goals: [],
      };
      const penaltyPlays = plays(penaltyPlay(1, '16:10', 4));
      expect(snapshotAt(result, penaltyPlays, 1000)).toMatchObject({ onClock: [{ remaining: 210 }], queued: [] });
      expect(snapshotAt(result, penaltyPlays, 1150)).toMatchObject({ onClock: [{ remaining: 60 }], queued: [] });
   });
});
