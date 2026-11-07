import { describe, expect, it } from 'vitest';
import { isPeriodBreak, penaltyLanes, trackFraction, trackTicks } from '@layout/scenarioTrack';
import type { ScenarioEvent } from '@domain/scenario';

describe('trackFraction', () => {
   it('places regulation time on one real-time scale', () => {
      expect(trackFraction(0)).toBe(0);
      expect(trackFraction(1800)).toBe(0.5);
   });
});

describe('trackTicks and isPeriodBreak', () => {
   it('ticks every five minutes and breaks between periods', () => {
      const ticks = trackTicks();
      expect(ticks).toHaveLength(13);
      expect(ticks.filter(isPeriodBreak)).toEqual([1200, 2400]);
   });
});

describe('penaltyLanes', () => {
   it('stacks overlapping penalties and reuses a lane once it is free', () => {
      const events: ScenarioEvent[] = [
         { id: 1, kind: 'penalty', side: 'away', time: 0, penaltyType: 'major' },
         { id: 2, kind: 'penalty', side: 'away', time: 60, penaltyType: 'minor' },
         { id: 3, kind: 'penalty', side: 'away', time: 300, penaltyType: 'minor' },
         { id: 4, kind: 'goal', side: 'away', time: 30 },
      ];
      const { laneOf, laneCount } = penaltyLanes(events);
      expect([...laneOf]).toEqual([
         [1, 0],
         [2, 1],
         [3, 0],
      ]);
      expect(laneCount).toEqual({ away: 2, home: 1 });
   });

   it('keeps the two teams apart', () => {
      const { laneOf } = penaltyLanes([
         { id: 1, kind: 'penalty', side: 'away', time: 0, penaltyType: 'minor' },
         { id: 2, kind: 'penalty', side: 'home', time: 0, penaltyType: 'minor' },
      ]);
      expect(laneOf.get(2)).toBe(0);
   });
});
