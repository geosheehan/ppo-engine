import { describe, expect, it } from 'vitest';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { countPowerPlays, totalsAt } from '@engine/powerPlayCounter';
import { snapshotAt } from '@engine/snapshot';
import { strengthAt } from '@engine/strength';
import { expectOneClockPerPlayer } from '@engine/tests/oneClock';
import { indexGame } from '@domain/game';
import { scenarioGame } from '@domain/scenario';
import type { ScenarioEvent, ScenarioSetup } from '@domain/scenario';

const THREE_REG: ScenarioSetup = { gameType: 'regular', regulation: 3, overtime: 0 };

function engineFor(events: ScenarioEvent[], setup: ScenarioSetup = THREE_REG) {
   const index = indexGame(scenarioGame(events, setup));
   const result = runPenaltyEngine(index);
   expectOneClockPerPlayer(index, result);
   return result;
}

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

describe('the engine on penalties to a player already in the box', () => {
   type Called = readonly [time: number, penaltyType: 'minor' | 'double-minor' | 'major'];
   const toPlayerOne = (...called: Called[]): ScenarioEvent[] =>
      called.map(([time, penaltyType], i) => ({
         id: i + 1,
         kind: 'penalty',
         side: 'away',
         time,
         penaltyType,
         player: 1,
      }));
   const homeGoal = (id: number, time: number): ScenarioEvent => ({
      id,
      kind: 'goal',
      side: 'home',
      time,
   });
   const homeTotals = (events: ScenarioEvent[]) =>
      totalsAt(countPowerPlays(engineFor(events).timeline), 3600).home;
   const clocksAt = (events: ScenarioEvent[], time: number) => {
      const index = indexGame(scenarioGame(events, THREE_REG));
      const plays = new Map(index.penalties.map((play) => [play.eventId, play]));
      return snapshotAt(runPenaltyEngine(index), plays, time);
   };

   it('keeps #1 on one clock for minors at P1 3:10 and 3:30, 5v4 until 7:10', () => {
      const result = engineFor(toPlayerOne([190, 'minor'], [210, 'minor']));
      expect(strengthAt(result.timeline, 220)).toEqual({ away: 4, home: 5 });
      expect(strengthAt(result.timeline, 429)).toEqual({ away: 4, home: 5 });
      expect(strengthAt(result.timeline, 430)).toEqual({ away: 5, home: 5 });
      expect(result.servedPenalties).toMatchObject([
         { penaltyEventId: 1, penaltyClock: 0, start: 190, end: 310 },
         { penaltyEventId: 2, penaltyClock: 0, start: 310, end: 430 },
      ]);
   });

   it('starts the added minor at the goal that releases his first one', () => {
      const result = engineFor([...toPlayerOne([300, 'minor'], [330, 'minor']), homeGoal(3, 360)]);
      expect(result.servedPenalties).toMatchObject([
         { penaltyEventId: 1, start: 300, end: 360, endReason: 'goal' },
         { penaltyEventId: 2, start: 360, end: 480, endReason: 'expired' },
      ]);
      expect(strengthAt(result.timeline, 470)).toEqual({ away: 4, home: 5 });
   });

   it('discards a major to #1 while he serves a minor, and reports it', () => {
      const result = engineFor(toPlayerOne([190, 'minor'], [210, 'major']));
      expect(result.servedPenalties).toMatchObject([{ penaltyEventId: 1, start: 190, end: 310 }]);
      expect(result.discardedPenalties).toEqual([
         { penaltyEventId: 2, side: 'away', time: 210, reason: 'notMinorToPlayerInBox' },
      ]);
      expect(strengthAt(result.timeline, 310)).toEqual({ away: 5, home: 5 });
      expect(homeTotals(toPlayerOne([190, 'minor'], [210, 'major']))).toEqual([
         { label: '5v4', opportunities: 1, goals: 0, seconds: 120 },
      ]);
   });

   it('discards a double minor to #1 while he serves a minor', () => {
      const result = engineFor(toPlayerOne([190, 'minor'], [210, 'double-minor']));
      expect(result.servedPenalties).toHaveLength(1);
      expect(result.discardedPenalties).toMatchObject([{ penaltyEventId: 2 }]);
   });

   it('serves a major to #1 again once his minor is over', () => {
      const result = engineFor(toPlayerOne([190, 'minor'], [310, 'major']));
      expect(result.discardedPenalties).toEqual([]);
      expect(result.servedPenalties).toMatchObject([
         { penaltyEventId: 1, end: 310 },
         { penaltyEventId: 2, start: 310 },
      ]);
   });

   it('shows his whole remaining time on his clock, with nothing queued', () => {
      const snapshot = clocksAt(toPlayerOne([190, 'minor'], [210, 'minor']), 250);
      expect(snapshot.onClock.map(({ remaining }) => remaining)).toEqual([180]);
      expect(snapshot.queued).toEqual([]);
   });

   // Decision 3: a penalty added while he is in the box counts like its same-second twin.
   it.each([
      ['a major then a minor', [300, 'major'], [400, 'minor']],
      ['a minor then a minor', [300, 'minor'], [330, 'minor']],
      ['a double minor then a minor', [300, 'double-minor'], [400, 'minor']],
   ] as const)('counts %s added later like the same-second call', (_, first, later) => {
      const sameSecond = homeTotals(toPlayerOne(first, [first[0], later[1]]));
      expect(homeTotals(toPlayerOne(first, later))).toEqual(sameSecond);
      expect(sameSecond.reduce((sum, total) => sum + total.opportunities, 0)).toBeGreaterThan(1);
   });

   it('counts a goal releasing the first of two minors like the same-second call', () => {
      const goal = homeGoal(3, 360);
      expect(homeTotals([...toPlayerOne([300, 'minor'], [330, 'minor']), goal])).toEqual(
         homeTotals([...toPlayerOne([300, 'minor'], [300, 'minor']), goal]),
      );
   });

   it('shows only the served half of a double minor whose other half was canceled', () => {
      const snapshot = clocksAt(
         [
            { id: 1, kind: 'penalty', side: 'home', time: 0, penaltyType: 'minor', player: 1 },
            {
               id: 2,
               kind: 'penalty',
               side: 'away',
               time: 0,
               penaltyType: 'double-minor',
               player: 1,
            },
         ],
         60,
      );
      expect(snapshot.onClock.map(({ remaining }) => remaining)).toEqual([60]);
   });
});
