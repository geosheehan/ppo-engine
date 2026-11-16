import { describe, expect, it } from 'vitest';
import { indexGame } from '@domain/game';
import { periodLabel } from '@domain/labels';
import { isGoal, isPenalty, playTime } from '@domain/plays';
import {
   DEFAULT_SETUP,
   isDiscarded,
   lastEventTime,
   nearestPenaltyType,
   overtimeWinner,
   scenarioClock,
   scenarioEnd,
   scenarioGame,
   scenarioPeriod,
   scenarioSeconds,
   snapTime,
} from '@domain/scenario';
import type { ScenarioEvent, ScenarioSetup } from '@domain/scenario';

const THREE_REG: ScenarioSetup = { gameType: 'regular', regulation: 3, overtime: 0 };
const REG_WITH_OT: ScenarioSetup = { gameType: 'regular', regulation: 3, overtime: 1 };
const PLAYOFF_2OT: ScenarioSetup = { gameType: 'playoff', regulation: 3, overtime: 2 };

describe('snapTime', () => {
   it('rounds to the nearest 5 seconds', () => {
      expect(snapTime(62, THREE_REG)).toBe(60);
      expect(snapTime(63, THREE_REG)).toBe(65);
   });

   it('keeps events inside the game, before the final horn', () => {
      expect(snapTime(-30, THREE_REG)).toBe(0);
      expect(snapTime(4000, THREE_REG)).toBe(3595);
      expect(snapTime(4000, DEFAULT_SETUP)).toBe(1195);
      expect(lastEventTime(REG_WITH_OT)).toBe(3895);
   });
});

describe('scenarioSeconds', () => {
   it('gives regular-season OT five minutes and playoff OT twenty', () => {
      expect(scenarioSeconds(DEFAULT_SETUP)).toBe(1200);
      expect(scenarioSeconds(REG_WITH_OT)).toBe(3900);
      expect(scenarioSeconds(PLAYOFF_2OT)).toBe(6000);
      expect(scenarioSeconds({ gameType: 'regular', regulation: 0, overtime: 1 })).toBe(300);
   });
});

describe('nearestPenaltyType', () => {
   it('snaps a dragged length to the closest called length', () => {
      expect(nearestPenaltyType(100)).toBe('minor');
      expect(nearestPenaltyType(200)).toBe('double-minor');
      expect(nearestPenaltyType(280)).toBe('major');
      expect(nearestPenaltyType(1000)).toBe('major');
   });

   it('gives a tie to the shorter penalty', () => {
      expect(nearestPenaltyType(180)).toBe('minor');
   });
});

describe('scenarioPeriod and scenarioClock', () => {
   it('puts a period break in the period that starts there', () => {
      expect(scenarioPeriod(1199, THREE_REG)).toBe(1);
      expect(scenarioPeriod(1200, THREE_REG)).toBe(2);
      expect(scenarioClock(1200, THREE_REG)).toBe('0:00');
      expect(scenarioClock(2465, THREE_REG)).toBe('1:05');
   });

   it('keeps the final horn in the last period', () => {
      expect(scenarioPeriod(1200, DEFAULT_SETUP)).toBe(1);
      expect(scenarioClock(1200, DEFAULT_SETUP)).toBe('20:00');
      expect(scenarioClock(3900, REG_WITH_OT)).toBe('5:00');
   });

   it('labels OT periods after the REG ones', () => {
      expect(periodLabel(4, REG_WITH_OT.regulation)).toBe('OT');
      expect(periodLabel(5, PLAYOFF_2OT.regulation)).toBe('2OT');
      expect(periodLabel(1, 0)).toBe('OT');
   });
});

describe('overtimeWinner', () => {
   const events: ScenarioEvent[] = [
      { id: 1, kind: 'goal', side: 'home', time: 600 },
      { id: 2, kind: 'goal', side: 'away', time: 3700 },
      { id: 3, kind: 'penalty', side: 'home', time: 3750, penaltyType: 'minor' },
      { id: 4, kind: 'goal', side: 'home', time: 3650 },
   ];

   it('ends the game at the first OT goal and discards what comes after', () => {
      const winner = overtimeWinner(events, REG_WITH_OT);
      expect(winner?.id).toBe(4);
      expect(scenarioEnd(events, REG_WITH_OT)).toBe(3650);
      expect(events.filter((event) => isDiscarded(event, winner)).map(({ id }) => id)).toEqual([
         2, 3,
      ]);
   });

   it('ignores REG goals', () => {
      expect(overtimeWinner(events.slice(0, 1), REG_WITH_OT)).toBeUndefined();
      expect(scenarioEnd([], REG_WITH_OT)).toBe(3900);
   });
});

describe('scenarioGame', () => {
   const events: ScenarioEvent[] = [
      { id: 1, kind: 'penalty', side: 'away', time: 300, penaltyType: 'double-minor' },
      { id: 2, kind: 'goal', side: 'home', time: 330 },
      { id: 3, kind: 'penalty', side: 'home', time: 300, penaltyType: 'major' },
      { id: 4, kind: 'goal', side: 'home', time: 1200 },
      { id: 5, kind: 'stoppage', time: 1500 },
   ];
   const index = indexGame(scenarioGame(events, THREE_REG));

   it('plays the events in time order, between the period plays and opening faceoffs', () => {
      expect(index.plays.map((play) => [play.typeDescKey, playTime(play)])).toEqual([
         ['period-start', 0],
         ['faceoff', 0],
         ['penalty', 300],
         ['penalty', 300],
         ['goal', 330],
         ['period-end', 1200],
         ['period-start', 1200],
         ['faceoff', 1200],
         ['goal', 1200],
         ['faceoff', 1500],
         ['period-end', 2400],
         ['period-start', 2400],
         ['faceoff', 2400],
         ['period-end', 3600],
         ['game-end', 3600],
      ]);
   });

   it('keeps events at the same second in the order they were added', () => {
      expect(index.penalties.map((play) => play.eventId)).toEqual([1, 3]);
   });

   it('calls each penalty with its length and severity, taken by its own player', () => {
      const [awayPenalty, homePenalty] = index.penalties;
      expect(awayPenalty.details).toMatchObject({ typeCode: 'MIN', duration: 4 });
      expect(homePenalty.details).toMatchObject({ typeCode: 'MAJ', duration: 5 });
      expect(index.playerById(awayPenalty.details.committedByPlayerId ?? -1)?.sweaterNumber).toBe(
         1,
      );
      expect(index.sideOf(homePenalty.details.eventOwnerTeamId)).toBe('home');
   });

   it('keeps a running score on goals', () => {
      const goals = index.plays.filter(isGoal);
      expect(goals.map((goal) => goal.details.homeScore)).toEqual([1, 2]);
   });

   it('turns only penalty events into penalty plays', () => {
      expect(index.plays.filter(isPenalty)).toHaveLength(2);
   });

   it('ends a 5:00 regular-season OT and marks it as OT', () => {
      const game = scenarioGame([], REG_WITH_OT);
      expect(game.regPeriods).toBe(3);
      const end = game.plays.find((play) => play.typeDescKey === 'game-end');
      expect(end && [playTime(end), end.periodDescriptor.periodType]).toEqual([3900, 'OT']);
   });

   it('ends a sudden-death game at the winner and leaves out later events', () => {
      const game = scenarioGame(
         [
            { id: 1, kind: 'goal', side: 'home', time: 3700 },
            { id: 2, kind: 'penalty', side: 'away', time: 3750, penaltyType: 'minor' },
         ],
         PLAYOFF_2OT,
      );
      expect(game.gameType).toBe(3);
      expect(game.plays.filter((play) => play.typeDescKey === 'period-start')).toHaveLength(4);
      expect(game.plays.some((play) => play.eventId === 2)).toBe(false);
      const end = game.plays.find((play) => play.typeDescKey === 'game-end');
      expect(end && playTime(end)).toBe(3700);
   });
});
