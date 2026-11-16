import { describe, expect, it } from 'vitest';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { countPowerPlays, totalsAt } from '@engine/powerPlayCounter';
import { strengthAt } from '@engine/strength';
import { indexGame } from '@domain/game';
import { scenarioGame } from '@domain/scenario';
import type { ScenarioEvent, ScenarioSetup } from '@domain/scenario';

const THREE_REG: ScenarioSetup = { gameType: 'regular', regulation: 3, overtime: 0 };

const engineFor = (events: ScenarioEvent[], setup: ScenarioSetup = THREE_REG) =>
   runPenaltyEngine(indexGame(scenarioGame(events, setup)));

describe('the engine on a scenario game', () => {
   it('serves a lone minor as a 5-on-4 that runs out after two minutes', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'away', time: 300, penaltyType: 'minor' },
      ]);
      expect(strengthAt(result.timeline, 360)).toEqual({ away: 4, home: 5 });
      expect(result.servedPenalties).toMatchObject([
         { penaltyEventId: 1, start: 300, end: 420, endReason: 'expired' },
      ]);
      expect(totalsAt(countPowerPlays(result.timeline), 3600).home).toEqual([
         { label: '5v4', opportunities: 1, goals: 0, seconds: 120 },
      ]);
   });

   it('releases the minor on a power-play goal', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'away', time: 300, penaltyType: 'minor' },
         { id: 2, kind: 'goal', side: 'home', time: 345 },
      ]);
      expect(result.servedPenalties).toMatchObject([{ end: 345, endReason: 'goal' }]);
      expect(result.goals).toMatchObject([
         { goalEventId: 2, strength: { away: 4, home: 5 }, releasedPenaltyEventId: 1 },
      ]);
   });

   it('plays one minor each at the same second 4-on-4', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'away', time: 300, penaltyType: 'minor' },
         { id: 2, kind: 'penalty', side: 'home', time: 300, penaltyType: 'minor' },
      ]);
      expect(strengthAt(result.timeline, 360)).toEqual({ away: 4, home: 4 });
      expect(result.servedPenalties.every((penalty) => penalty.coincidental)).toBe(true);
   });

   it('runs a penalty across a period break', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'home', time: 1140, penaltyType: 'major' },
      ]);
      expect(result.servedPenalties).toMatchObject([{ start: 1140, end: 1440 }]);
   });

   it('cuts off a penalty still running at the final horn', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'home', time: 3540, penaltyType: 'minor' },
      ]);
      expect(result.servedPenalties).toMatchObject([{ end: 3600, endReason: 'gameEnd' }]);
   });
});

describe('the engine on scenario overtime', () => {
   const ONE_REG_WITH_OT: ScenarioSetup = { gameType: 'regular', regulation: 1, overtime: 1 };

   it('goes 4-on-3, then 4-on-4 when the penalty expires, then 3-on-3 at the next stoppage', () => {
      const result = engineFor(
         [
            { id: 1, kind: 'penalty', side: 'away', time: 1260, penaltyType: 'minor' },
            { id: 2, kind: 'stoppage', time: 1440 },
         ],
         ONE_REG_WITH_OT,
      );
      expect(strengthAt(result.timeline, 1230)).toEqual({ away: 3, home: 3 });
      expect(strengthAt(result.timeline, 1300)).toEqual({ away: 3, home: 4 });
      expect(strengthAt(result.timeline, 1400)).toEqual({ away: 4, home: 4 });
      expect(strengthAt(result.timeline, 1450)).toEqual({ away: 3, home: 3 });
   });

   it('carries a penalty from the last REG period into OT', () => {
      const result = engineFor(
         [{ id: 1, kind: 'penalty', side: 'home', time: 3540, penaltyType: 'minor' }],
         { gameType: 'regular', regulation: 3, overtime: 1 },
      );
      expect(result.servedPenalties).toMatchObject([{ start: 3540, end: 3660 }]);
      expect(strengthAt(result.timeline, 3630)).toEqual({ away: 4, home: 3 });
      expect(strengthAt(result.timeline, 3670)).toEqual({ away: 4, home: 4 });
   });

   it('carries a penalty between two playoff OT periods at full strength', () => {
      const result = engineFor(
         [{ id: 1, kind: 'penalty', side: 'away', time: 2340, penaltyType: 'major' }],
         { gameType: 'playoff', regulation: 1, overtime: 2 },
      );
      expect(result.servedPenalties).toMatchObject([{ start: 2340, end: 2640 }]);
      expect(strengthAt(result.timeline, 2500)).toEqual({ away: 4, home: 5 });
   });

   it('plays an OT-only game at 3-on-3', () => {
      const result = engineFor([], { gameType: 'regular', regulation: 0, overtime: 1 });
      expect(strengthAt(result.timeline, 10)).toEqual({ away: 3, home: 3 });
   });

   it('ends the game at the OT winner and never sees what comes after', () => {
      const result = engineFor(
         [
            { id: 1, kind: 'penalty', side: 'away', time: 1260, penaltyType: 'major' },
            { id: 2, kind: 'goal', side: 'home', time: 1290 },
            { id: 3, kind: 'penalty', side: 'home', time: 1300, penaltyType: 'minor' },
         ],
         ONE_REG_WITH_OT,
      );
      expect(result.servedPenalties).toMatchObject([{ penaltyEventId: 1, end: 1290 }]);
   });
});
