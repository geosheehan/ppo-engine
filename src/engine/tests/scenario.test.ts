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
         { id: 1, kind: 'penalty', side: 'away', time: 300, penaltyType: 'minor', player: 1 },
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
         { id: 1, kind: 'penalty', side: 'away', time: 300, penaltyType: 'minor', player: 1 },
         { id: 2, kind: 'goal', side: 'home', time: 345 },
      ]);
      expect(result.servedPenalties).toMatchObject([{ end: 345, endReason: 'goal' }]);
      expect(result.goals).toMatchObject([
         { goalEventId: 2, strength: { away: 4, home: 5 }, releasedPenaltyEventId: 1 },
      ]);
   });

   it('plays one minor each at the same second 4-on-4', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'away', time: 300, penaltyType: 'minor', player: 1 },
         { id: 2, kind: 'penalty', side: 'home', time: 300, penaltyType: 'minor', player: 2 },
      ]);
      expect(strengthAt(result.timeline, 360)).toEqual({ away: 4, home: 4 });
      expect(result.servedPenalties.every((penalty) => penalty.coincidental)).toBe(true);
   });

   it('runs a penalty across a period break', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'home', time: 1140, penaltyType: 'major', player: 1 },
      ]);
      expect(result.servedPenalties).toMatchObject([{ start: 1140, end: 1440 }]);
   });

   it('cuts off a penalty still running at the final horn', () => {
      const result = engineFor([
         { id: 1, kind: 'penalty', side: 'home', time: 3540, penaltyType: 'minor', player: 1 },
      ]);
      expect(result.servedPenalties).toMatchObject([{ end: 3600, endReason: 'gameEnd' }]);
   });
});

describe('the engine on scenario overtime', () => {
   const ONE_REG_WITH_OT: ScenarioSetup = { gameType: 'regular', regulation: 1, overtime: 1 };

   it('goes 4-on-3, then 4-on-4 when the penalty expires, then 3-on-3 at the next stoppage', () => {
      const result = engineFor(
         [
            { id: 1, kind: 'penalty', side: 'away', time: 1260, penaltyType: 'minor', player: 1 },
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
         [{ id: 1, kind: 'penalty', side: 'home', time: 3540, penaltyType: 'minor', player: 1 }],
         { gameType: 'regular', regulation: 3, overtime: 1 },
      );
      expect(result.servedPenalties).toMatchObject([{ start: 3540, end: 3660 }]);
      expect(strengthAt(result.timeline, 3630)).toEqual({ away: 4, home: 3 });
      expect(strengthAt(result.timeline, 3670)).toEqual({ away: 4, home: 4 });
   });

   it('carries a penalty between two playoff OT periods at full strength', () => {
      const result = engineFor(
         [{ id: 1, kind: 'penalty', side: 'away', time: 2340, penaltyType: 'major', player: 1 }],
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
            { id: 1, kind: 'penalty', side: 'away', time: 1260, penaltyType: 'major', player: 1 },
            { id: 2, kind: 'goal', side: 'home', time: 1290 },
            { id: 3, kind: 'penalty', side: 'home', time: 1300, penaltyType: 'minor', player: 3 },
         ],
         ONE_REG_WITH_OT,
      );
      expect(result.servedPenalties).toMatchObject([{ penaltyEventId: 1, end: 1290 }]);
   });
});

// Rule 20.1 and 26.1: one player's penalties called together are served one after another on one clock, while
// penalties to different players each take a clock, and a third player waits for a clock to free up.
describe('the engine on scenario players', () => {
   type Called = [
      id: number,
      time: number,
      penaltyType: 'minor' | 'double-minor' | 'major',
      player: number,
   ];
   const awayPenalties = (...called: Called[]): ScenarioEvent[] =>
      called.map(([id, time, penaltyType, player]) => ({
         id,
         kind: 'penalty',
         side: 'away',
         time,
         penaltyType,
         player,
      }));

   it('serves a major and a minor to one player back to back, major first', () => {
      const result = engineFor(awayPenalties([1, 300, 'minor', 1], [2, 300, 'major', 1]));
      expect(strengthAt(result.timeline, 360)).toEqual({ away: 4, home: 5 });
      expect(strengthAt(result.timeline, 650)).toEqual({ away: 4, home: 5 });
      expect(strengthAt(result.timeline, 730)).toEqual({ away: 5, home: 5 });
      expect(result.servedPenalties).toMatchObject([
         { penaltyEventId: 2, start: 300, end: 600 },
         { penaltyEventId: 1, start: 600, end: 720 },
      ]);
   });

   it('puts a major and a minor to two players on both clocks', () => {
      const result = engineFor(awayPenalties([1, 300, 'minor', 1], [2, 300, 'major', 2]));
      expect(strengthAt(result.timeline, 360)).toEqual({ away: 3, home: 5 });
      expect(strengthAt(result.timeline, 500)).toEqual({ away: 4, home: 5 });
   });

   it('serves a double minor and a minor to one player as six straight minutes', () => {
      const result = engineFor(awayPenalties([1, 300, 'double-minor', 1], [2, 300, 'minor', 1]));
      expect(strengthAt(result.timeline, 360)).toEqual({ away: 4, home: 5 });
      expect(strengthAt(result.timeline, 650)).toEqual({ away: 4, home: 5 });
      expect(strengthAt(result.timeline, 670)).toEqual({ away: 5, home: 5 });
      expect(result.servedPenalties.map(({ start, end }) => [start, end])).toEqual([
         [300, 420],
         [420, 540],
         [540, 660],
      ]);
   });

   it('holds the penalty of a third player until a clock frees up', () => {
      const result = engineFor(
         awayPenalties([1, 300, 'minor', 1], [2, 330, 'minor', 2], [3, 360, 'minor', 3]),
      );
      expect(strengthAt(result.timeline, 400)).toEqual({ away: 3, home: 5 });
      expect(result.servedPenalties).toMatchObject([
         { penaltyEventId: 1, start: 300, end: 420 },
         { penaltyEventId: 2, start: 330, end: 450 },
         { penaltyEventId: 3, start: 420, end: 540 },
      ]);
      expect(strengthAt(result.timeline, 500)).toEqual({ away: 4, home: 5 });
   });
});
