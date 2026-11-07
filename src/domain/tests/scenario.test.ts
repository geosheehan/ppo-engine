import { describe, expect, it } from 'vitest';
import { indexGame } from '@domain/game';
import { isGoal, isPenalty, playTime } from '@domain/plays';
import {
   nearestPenaltyType,
   SCENARIO_LAST_TIME,
   scenarioClock,
   scenarioGame,
   scenarioPeriod,
   snapTime,
} from '@domain/scenario';
import type { ScenarioEvent } from '@domain/scenario';

describe('snapTime', () => {
   it('rounds to the nearest 5 seconds', () => {
      expect(snapTime(62)).toBe(60);
      expect(snapTime(63)).toBe(65);
   });

   it('keeps events inside regulation, before the final horn', () => {
      expect(snapTime(-30)).toBe(0);
      expect(snapTime(4000)).toBe(SCENARIO_LAST_TIME);
      expect(SCENARIO_LAST_TIME).toBe(3595);
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
      expect(scenarioPeriod(1199)).toBe(1);
      expect(scenarioPeriod(1200)).toBe(2);
      expect(scenarioClock(1200)).toBe('0:00');
      expect(scenarioClock(2465)).toBe('1:05');
   });
});

describe('scenarioGame', () => {
   const events: ScenarioEvent[] = [
      { id: 1, kind: 'penalty', side: 'away', time: 300, penaltyType: 'double-minor' },
      { id: 2, kind: 'goal', side: 'home', time: 330 },
      { id: 3, kind: 'penalty', side: 'home', time: 300, penaltyType: 'major' },
      { id: 4, kind: 'goal', side: 'home', time: 1200 },
   ];
   const index = indexGame(scenarioGame(events));

   it('plays the events in time order, between the period plays', () => {
      expect(index.plays.map((play) => [play.typeDescKey, playTime(play)])).toEqual([
         ['period-start', 0],
         ['penalty', 300],
         ['penalty', 300],
         ['goal', 330],
         ['period-end', 1200],
         ['period-start', 1200],
         ['goal', 1200],
         ['period-end', 2400],
         ['period-start', 2400],
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
});
