import { describe, expect, it } from 'vitest';
import type { Game, GoalPlay, Side } from '@domain/types';
import { isGoal } from '@domain/types';
import { gameSeconds } from '@domain/clock';
import { indexGame } from '@domain/game';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { goalSituation, opportunityTotals, powerPlayOpportunities } from '@engine/opportunities';
import type { GoalEffect, PenaltyEngineResult, ServedPenalty, StrengthInterval } from '@engine/types';

const P2 = (clock: string) => gameSeconds(2, clock);

const goalPlay = (eventId: number, period: number, timeInPeriod: string) => ({
   eventId,
   typeCode: 505,
   typeDescKey: 'goal',
   sortOrder: eventId,
   periodDescriptor: { number: period, periodType: 'REG', maxRegulationPeriods: 3 },
   timeInPeriod,
   details: {},
}) as unknown as GoalPlay;

const goalPlays = (...list: GoalPlay[]) => new Map(list.map((play) => [play.eventId, play]));

const served = (overrides: Partial<ServedPenalty>): ServedPenalty => ({
   penaltyEventId: 1,
   side: 'home',
   penaltyClock: 0,
   kind: 'minor',
   start: 0,
   end: 120,
   endReason: 'expired',
   coincidental: false,
   ...overrides,
});

const goal = (overrides: Partial<GoalEffect>): GoalEffect => ({
   goalEventId: 900,
   side: 'away',
   strength: { away: 5, home: 4 },
   penaltyShot: false,
   ...overrides,
});

const interval = (away: number, home: number, start: number, end: number): StrengthInterval => ({ away, home, start, end });

const result = (parts: Partial<PenaltyEngineResult>): PenaltyEngineResult => ({
   timeline: [],
   servedPenalties: [],
   strengthIntervals: [],
   goals: [],
   ...parts,
});

describe('goalSituation', () => {
   it('calls a goal by the team with more skaters a power-play goal', () => {
      expect(goalSituation(goal({ side: 'away', strength: { away: 5, home: 4 } }))).toBe('power-play');
      expect(goalSituation(goal({ side: 'home', strength: { away: 3, home: 5 } }))).toBe('power-play');
   });

   it('calls a goal by the team with fewer skaters shorthanded', () => {
      expect(goalSituation(goal({ side: 'home', strength: { away: 5, home: 4 } }))).toBe('shorthanded');
      expect(goalSituation(goal({ side: 'away', strength: { away: 3, home: 4 } }))).toBe('shorthanded');
   });

   it('gives no situation at even strength, 4v4 and 3v3 included', () => {
      for (const skaters of [5, 4, 3]) {
         expect(goalSituation(goal({ strength: { away: skaters, home: skaters } }))).toBeNull();
      }
   });

   it('gives no situation to a penalty-shot goal, whatever the strength', () => {
      expect(goalSituation(goal({ side: 'away', strength: { away: 5, home: 4 }, penaltyShot: true }))).toBeNull();
      expect(goalSituation(goal({ side: 'home', strength: { away: 5, home: 4 }, penaltyShot: true }))).toBeNull();
   });
});

describe('powerPlayOpportunities (NHL counting)', () => {
   // STL @ VAN, Aug 17 2020: VAN minors at P2 13:51 and 14:59, STL scores at 15:47 on the 5v3,
   // and VAN's second minor expires at 16:59.
   const stlAtVan = result({
      servedPenalties: [
         served({ penaltyEventId: 1, penaltyClock: 0, start: P2('13:51'), end: P2('15:47'), endReason: 'goal', releasedByGoalId: 900 }),
         served({ penaltyEventId: 2, penaltyClock: 1, start: P2('14:59'), end: P2('16:59') }),
      ],
      strengthIntervals: [
         interval(5, 5, 0, P2('13:51')),
         interval(5, 4, P2('13:51'), P2('14:59')),
         interval(5, 3, P2('14:59'), P2('15:47')),
         interval(5, 4, P2('15:47'), P2('16:59')),
         interval(5, 5, P2('16:59'), P2('20:00')),
      ],
      goals: [goal({ strength: { away: 5, home: 3 }, releasedPenaltyEventId: 1 })],
   });
   const stlGoal = goalPlays(goalPlay(900, 2, '15:47'));

   it('counts STL @ VAN as one 5v4 (2:20) and one 5v3 (0:48, 1 goal)', () => {
      expect(opportunityTotals(stlAtVan, stlGoal)).toEqual({
         away: [
            { label: '5v4', opportunities: 1, goals: 0, seconds: 140 },
            { label: '5v3', opportunities: 1, goals: 1, seconds: 48 },
         ],
         home: [],
      });
   });

   it('only counts what has happened by the given time', () => {
      // 15:20 of the 2nd: mid 5v3, before the goal.
      expect(opportunityTotals(stlAtVan, stlGoal, P2('15:20')).away).toEqual([
         { label: '5v4', opportunities: 1, goals: 0, seconds: 68 },
         { label: '5v3', opportunities: 1, goals: 0, seconds: 21 },
      ]);
   });

   it('does not award a new opportunity when a 4v3 becomes a 5v4', () => {
      // Coincidental minors expire while the other team's minor is still running.
      const opportunities = powerPlayOpportunities(result({
         strengthIntervals: [interval(4, 4, 0, 28), interval(4, 3, 28, 120), interval(5, 4, 120, 148)],
      }), goalPlays());
      expect(opportunities).toEqual([{ side: 'away', strength: { away: 4, home: 3 }, time: 28 }]);
   });

   it('gives n + 1 opportunities for a major with n power-play goals', () => {
      const totals = opportunityTotals(result({
         servedPenalties: [served({ kind: 'major', start: 0, end: 300 })],
         strengthIntervals: [interval(5, 4, 0, 300)],
         goals: [goal({ goalEventId: 901 }), goal({ goalEventId: 902 })],
      }), goalPlays(goalPlay(901, 1, '01:40'), goalPlay(902, 1, '03:20')));
      expect(totals.away).toEqual([{ label: '5v4', opportunities: 3, goals: 2, seconds: 300 }]);
   });

   it('gives a double minor one opportunity per half, the second when that half starts', () => {
      const noGoal = powerPlayOpportunities(result({
         servedPenalties: [
            served({ doubleMinorHalf: 1, start: 0, end: 120 }),
            served({ doubleMinorHalf: 2, start: 120, end: 240 }),
         ],
         strengthIntervals: [interval(5, 4, 0, 240)],
      }), goalPlays());
      expect(noGoal.map((opportunity) => opportunity.time)).toEqual([0, 120]);
   });

   it('does not give a third opportunity for a goal in the first half of a double minor', () => {
      const totals = opportunityTotals(result({
         servedPenalties: [
            served({ doubleMinorHalf: 1, start: 0, end: 60, endReason: 'goal', releasedByGoalId: 901 }),
            served({ doubleMinorHalf: 2, start: 60, end: 180 }),
         ],
         strengthIntervals: [interval(5, 4, 0, 180)],
         goals: [goal({ goalEventId: 901, releasedPenaltyEventId: 1 })],
      }), goalPlays(goalPlay(901, 1, '01:00')));
      expect(totals.away).toEqual([{ label: '5v4', opportunities: 2, goals: 1, seconds: 180 }]);
   });

   it('gives one opportunity when only the second half of a double minor is served', () => {
      // The first half was washed out by a goal on the delayed penalty.
      const opportunities = powerPlayOpportunities(result({
         servedPenalties: [served({ doubleMinorHalf: 2, start: 0, end: 120 })],
         strengthIntervals: [interval(5, 4, 0, 120)],
      }), goalPlays());
      expect(opportunities).toHaveLength(1);
   });

   it('types the second half of a double minor by the strength it starts at', () => {
      // Minor at 10:00 (5v4), double minor at 11:00 (5v3), minor expires at 12:00 (5v4),
      // second half starts at 13:00.
      const totals = opportunityTotals(result({
         servedPenalties: [
            served({ penaltyEventId: 1, penaltyClock: 0, start: 600, end: 720 }),
            served({ penaltyEventId: 2, penaltyClock: 1, doubleMinorHalf: 1, start: 660, end: 780 }),
            served({ penaltyEventId: 2, penaltyClock: 1, doubleMinorHalf: 2, start: 780, end: 900 }),
         ],
         strengthIntervals: [interval(5, 4, 600, 660), interval(5, 3, 660, 720), interval(5, 4, 720, 900)],
      }), goalPlays());
      expect(totals.away).toEqual([
         { label: '5v4', opportunities: 2, goals: 0, seconds: 240 },
         { label: '5v3', opportunities: 1, goals: 0, seconds: 60 },
      ]);
   });

   it('awards a queued double minor\'s first opportunity when it starts running', () => {
      // Minors at 10:00 and 11:00, double minor at 11:30 waits; it takes over at 12:00,
      // the second minor expires at 13:00 and the second half starts at 14:00.
      const opportunities = powerPlayOpportunities(result({
         servedPenalties: [
            served({ penaltyEventId: 1, penaltyClock: 0, start: 600, end: 720 }),
            served({ penaltyEventId: 2, penaltyClock: 1, start: 660, end: 780 }),
            served({ penaltyEventId: 3, penaltyClock: 0, doubleMinorHalf: 1, start: 720, end: 840 }),
            served({ penaltyEventId: 3, penaltyClock: 0, doubleMinorHalf: 2, start: 840, end: 960 }),
         ],
         strengthIntervals: [interval(5, 4, 600, 660), interval(5, 3, 660, 780), interval(5, 4, 780, 960)],
      }), goalPlays());
      expect(opportunities.map(({ strength, time }) => `${strength.away}v${strength.home}@${time}`))
         .toEqual(['5v4@600', '5v3@660', '5v3@720', '5v4@840']);
   });

   it('awards the second half of a double minor that starts as a 5v3 becomes a 5v4', () => {
      const opportunities = powerPlayOpportunities(result({
         servedPenalties: [
            served({ penaltyEventId: 1, penaltyClock: 0, doubleMinorHalf: 1, start: 0, end: 120 }),
            served({ penaltyEventId: 1, penaltyClock: 0, doubleMinorHalf: 2, start: 120, end: 240 }),
            served({ penaltyEventId: 2, penaltyClock: 1, start: 60, end: 120 }),
         ],
         strengthIntervals: [interval(5, 4, 0, 60), interval(5, 3, 60, 120), interval(5, 4, 120, 240)],
      }), goalPlays());
      expect(opportunities.map((opportunity) => opportunity.time)).toEqual([0, 60, 120]);
   });

   it('awards a new 5v3 when a queued penalty takes over a penalty clock', () => {
      // A at 10:00, B at 10:30, C at 11:00 waits; A expires at 12:00 and C starts on its clock.
      const totals = opportunityTotals(result({
         servedPenalties: [
            served({ penaltyEventId: 1, penaltyClock: 0, start: 600, end: 720 }),
            served({ penaltyEventId: 2, penaltyClock: 1, start: 630, end: 750 }),
            served({ penaltyEventId: 3, penaltyClock: 0, start: 720, end: 840 }),
         ],
         strengthIntervals: [interval(5, 4, 600, 630), interval(5, 3, 630, 750), interval(5, 4, 750, 840)],
      }), goalPlays());
      expect(totals.away).toEqual([
         { label: '5v4', opportunities: 1, goals: 0, seconds: 120 },
         { label: '5v3', opportunities: 2, goals: 0, seconds: 120 },
      ]);
   });

   it('awards a new opportunity when a player\'s minor follows their major', () => {
      const opportunities = powerPlayOpportunities(result({
         servedPenalties: [
            served({ penaltyEventId: 1, kind: 'major', start: 0, end: 300 }),
            served({ penaltyEventId: 2, start: 300, end: 420 }),
         ],
         strengthIntervals: [interval(5, 4, 0, 420)],
      }), goalPlays());
      expect(opportunities.map((opportunity) => opportunity.time)).toEqual([0, 300]);
   });

   it('ignores short-handed and penalty-shot goals', () => {
      const totals = opportunityTotals(result({
         servedPenalties: [served({ kind: 'major', start: 0, end: 300 })],
         strengthIntervals: [interval(5, 4, 0, 300)],
         goals: [
            goal({ goalEventId: 901, side: 'home' }),
            goal({ goalEventId: 902, penaltyShot: true }),
         ],
      }), goalPlays(goalPlay(901, 1, '01:40'), goalPlay(902, 1, '03:20')));
      expect(totals).toEqual({ away: [{ label: '5v4', opportunities: 1, goals: 0, seconds: 300 }], home: [] });
   });

   it('gives each team one 5v4 when a 4v4 swings the advantage', () => {
      // TOR (home) penalized first, then SEA (away) during it; TOR's penalty ends first.
      const totals = opportunityTotals(result({
         strengthIntervals: [interval(5, 4, 0, 60), interval(4, 4, 60, 120), interval(4, 5, 120, 180)],
      }), goalPlays());
      expect(totals).toEqual({
         away: [{ label: '5v4', opportunities: 1, goals: 0, seconds: 60 }],
         home: [{ label: '5v4', opportunities: 1, goals: 0, seconds: 60 }],
      });
   });
});

// The NHL's official power-play totals ("goals/opportunities") for the saved games.
const OFFICIAL: Record<string, Record<Side, string>> = {
   '20261028-SEAvTOR.json': { away: '2/3', home: '1/5' },
   '20110211-NYIvPIT.json': { away: '3/9', home: '2/5' },
   '20261029-DETvCHI.json': { away: '0/1', home: '1/4' },
};

const games = import.meta.glob<Game>('@data/games/*.json', { eager: true, import: 'default' });

describe.each(Object.entries(games)
   .map(([path, game]) => [path.split('/').pop()!, game] as const)
   .filter(([file]) => OFFICIAL[file]))('%s matches the official power-play totals', (file, game) => {
   const totals = opportunityTotals(runPenaltyEngine(indexGame(game)), new Map(game.plays.filter(isGoal).map((play) => [play.eventId, play])));

   it.each(['away', 'home'] as const)('%s', (side) => {
      const goals = totals[side].reduce((sum, total) => sum + total.goals, 0);
      const opportunities = totals[side].reduce((sum, total) => sum + total.opportunities, 0);
      expect(`${goals}/${opportunities}`).toBe(OFFICIAL[file][side]);
   });
});
