import { describe, expect, it } from 'vitest';
import type { Game, Side } from '@domain/types';
import { gameSeconds } from '@domain/clock';
import { indexGame } from '@domain/game';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { countPowerPlays, goalSituation, totalsAt } from '@engine/powerPlayCounter';
import type { GoalEffect, PenaltyOnClock, PenaltyStartReason, TimelineEntry } from '@engine/types';

const P2 = (clock: string) => gameSeconds(2, clock);

const strength = (time: number, away: number, home: number): TimelineEntry =>
   ({ kind: 'strength', time, strength: { away, home } });

const start = (time: number, side: Side, reason: PenaltyStartReason = 'called', penalty: Partial<PenaltyOnClock> = {}): TimelineEntry =>
   ({ kind: 'penaltyStart', time, reason, penalty: { penaltyEventId: 1, side, penaltyClock: 0, kind: 'minor', coincidental: false, ...penalty } });

const goalEffect = (overrides: Partial<GoalEffect>): GoalEffect => ({
   goalEventId: 900,
   side: 'away',
   strength: { away: 5, home: 4 },
   penaltyShot: false,
   ...overrides,
});

const goal = (time: number, side: Side, away: number, home: number, overrides: Partial<GoalEffect> = {}): TimelineEntry =>
   ({ kind: 'goal', time, goal: goalEffect({ side, strength: { away, home }, ...overrides }) });

const opportunitiesOf = (...timeline: TimelineEntry[]) =>
   countPowerPlays(timeline).opportunities.map(({ side, strength: { away, home }, time }) => `${side} ${away}v${home}@${time}`);

const totalsOf = (timeline: TimelineEntry[], time?: number) => totalsAt(countPowerPlays(timeline), time);

describe('goalSituation', () => {
   it('calls a goal by the team with more skaters a power-play goal', () => {
      expect(goalSituation(goalEffect({ side: 'away', strength: { away: 5, home: 4 } }))).toBe('power-play');
      expect(goalSituation(goalEffect({ side: 'home', strength: { away: 3, home: 5 } }))).toBe('power-play');
   });

   it('calls a goal by the team with fewer skaters shorthanded', () => {
      expect(goalSituation(goalEffect({ side: 'home', strength: { away: 5, home: 4 } }))).toBe('shorthanded');
      expect(goalSituation(goalEffect({ side: 'away', strength: { away: 3, home: 4 } }))).toBe('shorthanded');
   });

   it('gives no situation at even strength, 4v4 and 3v3 included', () => {
      for (const skaters of [5, 4, 3]) {
         expect(goalSituation(goalEffect({ strength: { away: skaters, home: skaters } }))).toBeNull();
      }
   });

   it('gives no situation to a penalty-shot goal, whatever the strength', () => {
      expect(goalSituation(goalEffect({ side: 'away', strength: { away: 5, home: 4 }, penaltyShot: true }))).toBeNull();
      expect(goalSituation(goalEffect({ side: 'home', strength: { away: 5, home: 4 }, penaltyShot: true }))).toBeNull();
   });
});

describe('countPowerPlays (NHL counting)', () => {
   // STL @ VAN, Aug 17 2020: VAN minors at P2 13:51 and 14:59, STL scores at 15:47 on the 5v3,
   // and VAN's second minor expires at 16:59.
   const stlAtVan = [
      start(P2('13:51'), 'home'), strength(P2('13:51'), 5, 4),
      start(P2('14:59'), 'home', 'called', { penaltyClock: 1 }), strength(P2('14:59'), 5, 3),
      goal(P2('15:47'), 'away', 5, 3), strength(P2('15:47'), 5, 4),
      strength(P2('16:59'), 5, 5),
   ];

   it('counts STL @ VAN as one 5v4 (2:20) and one 5v3 (0:48, 1 goal)', () => {
      expect(totalsOf(stlAtVan)).toEqual({
         away: [
            { label: '5v4', opportunities: 1, goals: 0, seconds: 140 },
            { label: '5v3', opportunities: 1, goals: 1, seconds: 48 },
         ],
         home: [],
      });
   });

   it('only counts what has happened by the given time', () => {
      // 15:20 of the 2nd: mid 5v3, before the goal.
      expect(totalsOf(stlAtVan, P2('15:20')).away).toEqual([
         { label: '5v4', opportunities: 1, goals: 0, seconds: 68 },
         { label: '5v3', opportunities: 1, goals: 0, seconds: 21 },
      ]);
   });

   it('keeps counting power-play time through a second where the strength changes and comes back', () => {
      // A goal at 1:00 releases a minor and a queued one starts on its clock in the same second.
      const timeline = [
         start(0, 'home'), strength(0, 5, 4),
         goal(60, 'away', 5, 4), strength(60, 5, 5), start(60, 'home', 'dequeued', { penaltyEventId: 2 }), strength(60, 5, 4),
         strength(180, 5, 5),
      ];
      expect(totalsOf(timeline, 90).away).toEqual([{ label: '5v4', opportunities: 2, goals: 1, seconds: 90 }]);
   });

   it('counts nothing before the first entry', () => {
      expect(totalsOf(stlAtVan, P2('10:00'))).toEqual({ away: [], home: [] });
   });

   it('does not award a new opportunity when a 4v3 becomes a 5v4', () => {
      // Coincidental minors expire while the other team's minor is still running.
      expect(opportunitiesOf(strength(0, 4, 4), strength(28, 4, 3), strength(120, 5, 4))).toEqual(['away 4v3@28']);
   });

   it('gives n + 1 opportunities for a major with n power-play goals', () => {
      const totals = totalsOf([
         start(0, 'home', 'called', { kind: 'major' }), strength(0, 5, 4),
         goal(100, 'away', 5, 4), goal(200, 'away', 5, 4),
         strength(300, 5, 5),
      ]);
      expect(totals.away).toEqual([{ label: '5v4', opportunities: 3, goals: 2, seconds: 300 }]);
   });

   it('gives a double minor one opportunity per half, the second when that half starts', () => {
      expect(opportunitiesOf(
         start(0, 'home', 'called', { doubleMinorHalf: 1 }), strength(0, 5, 4),
         start(120, 'home', 'nextInSentence', { doubleMinorHalf: 2 }),
         strength(240, 5, 5),
      )).toEqual(['away 5v4@0', 'away 5v4@120']);
   });

   it('does not give a third opportunity for a goal in the first half of a double minor', () => {
      const totals = totalsOf([
         start(0, 'home', 'called', { doubleMinorHalf: 1 }), strength(0, 5, 4),
         goal(60, 'away', 5, 4), start(60, 'home', 'nextInSentence', { doubleMinorHalf: 2 }),
         strength(180, 5, 5),
      ]);
      expect(totals.away).toEqual([{ label: '5v4', opportunities: 2, goals: 1, seconds: 180 }]);
   });

   it('gives one opportunity when only the second half of a double minor is served', () => {
      // The first half was washed out by a goal on the delayed penalty.
      expect(opportunitiesOf(
         start(0, 'home', 'called', { doubleMinorHalf: 2 }), strength(0, 5, 4),
         strength(120, 5, 5),
      )).toEqual(['away 5v4@0']);
   });

   it('types the second half of a double minor by the strength it starts at', () => {
      // Minor at 10:00 (5v4), double minor at 11:00 (5v3), minor expires at 12:00 (5v4),
      // second half starts at 13:00.
      const totals = totalsOf([
         start(600, 'home'), strength(600, 5, 4),
         start(660, 'home', 'called', { penaltyEventId: 2, penaltyClock: 1, doubleMinorHalf: 1 }), strength(660, 5, 3),
         strength(720, 5, 4),
         start(780, 'home', 'nextInSentence', { penaltyEventId: 2, penaltyClock: 1, doubleMinorHalf: 2 }),
         strength(900, 5, 5),
      ]);
      expect(totals.away).toEqual([
         { label: '5v4', opportunities: 2, goals: 0, seconds: 240 },
         { label: '5v3', opportunities: 1, goals: 0, seconds: 60 },
      ]);
   });

   it('awards a queued double minor\'s first opportunity when it starts running', () => {
      // Minors at 10:00 and 11:00, double minor at 11:30 waits; it starts at 12:00,
      // the second minor expires at 13:00 and the second half starts at 14:00.
      expect(opportunitiesOf(
         start(600, 'home'), strength(600, 5, 4),
         start(660, 'home', 'called', { penaltyEventId: 2, penaltyClock: 1 }), strength(660, 5, 3),
         start(720, 'home', 'dequeued', { penaltyEventId: 3, doubleMinorHalf: 1 }),
         strength(780, 5, 4),
         start(840, 'home', 'nextInSentence', { penaltyEventId: 3, doubleMinorHalf: 2 }),
         strength(960, 5, 5),
      )).toEqual(['away 5v4@600', 'away 5v3@660', 'away 5v3@720', 'away 5v4@840']);
   });

   it('awards the second half of a double minor that starts as a 5v3 becomes a 5v4', () => {
      expect(opportunitiesOf(
         start(0, 'home', 'called', { doubleMinorHalf: 1 }), strength(0, 5, 4),
         start(60, 'home', 'called', { penaltyEventId: 2, penaltyClock: 1 }), strength(60, 5, 3),
         start(120, 'home', 'nextInSentence', { doubleMinorHalf: 2 }), strength(120, 5, 4),
         strength(240, 5, 5),
      )).toEqual(['away 5v4@0', 'away 5v3@60', 'away 5v4@120']);
   });

   it('awards a new 5v3 when a queued penalty starts on the short-handed team\'s penalty clock', () => {
      // A at 10:00, B at 10:30, C at 11:00 waits; A expires at 12:00 and C starts on its clock.
      const totals = totalsOf([
         start(600, 'home'), strength(600, 5, 4),
         start(630, 'home', 'called', { penaltyEventId: 2, penaltyClock: 1 }), strength(630, 5, 3),
         start(720, 'home', 'dequeued', { penaltyEventId: 3 }),
         strength(750, 5, 4),
         strength(840, 5, 5),
      ]);
      expect(totals.away).toEqual([
         { label: '5v4', opportunities: 1, goals: 0, seconds: 120 },
         { label: '5v3', opportunities: 2, goals: 0, seconds: 120 },
      ]);
   });

   it('awards a new opportunity when a player\'s minor follows their major', () => {
      expect(opportunitiesOf(
         start(0, 'home', 'called', { kind: 'major' }), strength(0, 5, 4),
         start(300, 'home', 'nextInSentence', { penaltyEventId: 2 }),
         strength(420, 5, 5),
      )).toEqual(['away 5v4@0', 'away 5v4@300']);
   });

   it('does not award the advantaged team an opportunity for its own player\'s minor following their major', () => {
      // Away major and minor to one player at 10:00; two home minors at 14:00 give away a 4v3; the away player's
      // minor starts at 15:00; the home minors expire at 16:00 and the away minor at 17:00.
      expect(opportunitiesOf(
         start(600, 'away', 'called', { kind: 'major' }), strength(600, 4, 5),
         start(840, 'home', 'called', { penaltyEventId: 2 }), start(840, 'home', 'called', { penaltyEventId: 3, penaltyClock: 1 }),
         strength(840, 4, 3),
         start(900, 'away', 'nextInSentence', { penaltyEventId: 4 }),
         strength(960, 4, 5),
         strength(1020, 5, 5),
      )).toEqual(['home 4v5@600', 'away 4v3@840', 'home 4v5@960']);
   });

   it('ignores short-handed and penalty-shot goals', () => {
      const totals = totalsOf([
         start(0, 'home', 'called', { kind: 'major' }), strength(0, 5, 4),
         goal(100, 'home', 5, 4),
         goal(200, 'away', 5, 4, { penaltyShot: true }),
         strength(300, 5, 5),
      ]);
      expect(totals).toEqual({ away: [{ label: '5v4', opportunities: 1, goals: 0, seconds: 300 }], home: [] });
   });

   it('gives each team one 5v4 when a 4v4 swings the advantage', () => {
      // SEA (home) penalized first, then TOR (away) during it; SEA's penalty ends first.
      const totals = totalsOf([strength(0, 5, 4), strength(60, 4, 4), strength(120, 4, 5), strength(180, 5, 5)]);
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

const games = new Map(Object.entries(import.meta.glob<Game>('@data/games/*.json', { eager: true, import: 'default' }))
   .map(([path, game]) => [path.split('/').pop()!, game]));

it('has a saved game for every official total', () => {
   expect(Object.keys(OFFICIAL).filter((file) => !games.has(file))).toEqual([]);
});

describe.each(Object.keys(OFFICIAL).filter((file) => games.has(file)))('%s matches the official power-play totals', (file) => {
   const totals = totalsAt(countPowerPlays(runPenaltyEngine(indexGame(games.get(file)!)).timeline));

   it.each(['away', 'home'] as const)('%s', (side) => {
      const goals = totals[side].reduce((sum, total) => sum + total.goals, 0);
      const opportunities = totals[side].reduce((sum, total) => sum + total.opportunities, 0);
      expect(`${goals}/${opportunities}`).toBe(OFFICIAL[file][side]);
   });
});
