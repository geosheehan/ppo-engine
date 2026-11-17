import { describe, expect, it } from 'vitest';
import {
   isPeriodStart,
   penaltyLanes,
   tickSeconds,
   trackFraction,
   trackTicks,
} from '@layout/scenarioTrack';
import type { ScenarioEvent } from '@domain/scenario';

describe('trackFraction', () => {
   it('places game time on one real-time scale', () => {
      expect(trackFraction(0, 3600)).toBe(0);
      expect(trackFraction(1800, 3600)).toBe(0.5);
      expect(trackFraction(600, 1200)).toBe(0.5);
   });
});

describe('trackTicks and isPeriodStart', () => {
   it('ticks every five minutes and marks each period start', () => {
      const ticks = trackTicks(3600);
      expect(ticks).toHaveLength(13);
      expect(ticks.filter((time) => isPeriodStart(time, 3600))).toEqual([0, 1200, 2400]);
   });

   it('always ticks the final horn, even after a 5:00 OT', () => {
      expect(trackTicks(3900, 600).slice(-3)).toEqual([3000, 3600, 3900]);
      expect(trackTicks(1200, 1200)).toEqual([0, 1200]);
   });
});

describe('tickSeconds', () => {
   it('widens the tick step as the track narrows, down to one tick per period', () => {
      expect(tickSeconds(1800, 3600)).toBe(300);
      expect(tickSeconds(400, 3600)).toBe(600);
      expect(tickSeconds(200, 3600)).toBe(1200);
      expect(tickSeconds(0, 3600)).toBe(1200);
   });

   it('keeps five-minute ticks on a one-period track', () => {
      expect(tickSeconds(400, 1200)).toBe(300);
   });
});

describe('penaltyLanes', () => {
   it('stacks overlapping penalties and reuses a lane once it is free', () => {
      const events: ScenarioEvent[] = [
         { id: 1, kind: 'penalty', side: 'away', time: 0, penaltyType: 'major', player: 1 },
         { id: 2, kind: 'penalty', side: 'away', time: 60, penaltyType: 'minor', player: 2 },
         { id: 3, kind: 'penalty', side: 'away', time: 300, penaltyType: 'minor', player: 3 },
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
         { id: 1, kind: 'penalty', side: 'away', time: 0, penaltyType: 'minor', player: 1 },
         { id: 2, kind: 'penalty', side: 'home', time: 0, penaltyType: 'minor', player: 2 },
      ]);
      expect(laneOf.get(2)).toBe(0);
   });
});
