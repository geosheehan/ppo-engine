import { describe, expect, it } from 'vitest';
import type { Game } from '@domain/types';
import { indexGame } from '@domain/game';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import type { TimelineEntry } from '@engine/types';
import { AWAY, HOME, engineFor, gameEnd, goal, penalty, playerPenalty } from '@engine/tests/fixtures';

const starts = (timeline: TimelineEntry[]) => timeline.flatMap((entry) =>
   entry.kind === 'penaltyStart' ? [{ time: entry.time, reason: entry.reason, half: entry.penalty.doubleMinorHalf }] : []);

describe('engine timeline', () => {
   it('records a penalty starting and expiring, with the strength changes it causes', () => {
      const { timeline } = engineFor(penalty(HOME, '02:00', 2), gameEnd('20:00'));
      expect(timeline).toMatchObject([
         { kind: 'penaltyStart', time: 120, reason: 'called', penalty: { side: 'home', penaltyClock: 0 } },
         { kind: 'strength', time: 120, strength: { away: 5, home: 4 } },
         { kind: 'penaltyEnd', time: 240, penalty: { endReason: 'expired' } },
         { kind: 'strength', time: 240, strength: { away: 5, home: 5 } },
      ]);
   });

   it('marks a penalty that waited for a free penalty clock as dequeued', () => {
      const { timeline } = engineFor(penalty(HOME, '01:00', 2), penalty(HOME, '01:30', 2), penalty(HOME, '02:00', 2));
      expect(starts(timeline)).toEqual([
         { time: 60, reason: 'called', half: undefined },
         { time: 90, reason: 'called', half: undefined },
         { time: 180, reason: 'dequeued', half: undefined },
      ]);
   });

   it('marks a double minor\'s second half as next in sentence', () => {
      const { timeline } = engineFor(penalty(HOME, '02:00', 4));
      expect(starts(timeline)).toEqual([
         { time: 120, reason: 'called', half: 1 },
         { time: 240, reason: 'nextInSentence', half: 2 },
      ]);
   });

   it('marks a player\'s minor after their major as next in sentence', () => {
      const { timeline } = engineFor(playerPenalty(HOME, 7, '02:00', 5, 'MAJ'), playerPenalty(HOME, 7, '02:00', 2));
      expect(starts(timeline)).toEqual([
         { time: 120, reason: 'called', half: undefined },
         { time: 420, reason: 'nextInSentence', half: undefined },
      ]);
   });

   it('records a power-play goal after the minor it releases, then the strength change', () => {
      const { timeline } = engineFor(penalty(HOME, '02:00', 2), goal(AWAY, '03:00'));
      expect(timeline.filter((entry) => entry.time === 180)).toMatchObject([
         { kind: 'penaltyEnd', penalty: { endReason: 'goal' } },
         { kind: 'goal', goal: { side: 'away', strength: { away: 5, home: 4 } } },
         { kind: 'strength', strength: { away: 5, home: 5 } },
      ]);
   });
});

const games = import.meta.glob<Game>('@data/games/*.json', { eager: true, import: 'default' });

describe.each(Object.entries(games).map(([path, game]) => [path.split('/').pop()!, game] as const))('%s timeline', (_, game) => {
   const result = runPenaltyEngine(indexGame(game));

   it('is in game order', () => {
      const times = result.timeline.map((entry) => entry.time);
      expect(times).toEqual(times.toSorted((a, b) => a - b));
   });

   it('ends every penalty it starts', () => {
      const count = (kind: TimelineEntry['kind']) => result.timeline.filter((entry) => entry.kind === kind).length;
      expect(count('penaltyStart')).toBe(count('penaltyEnd'));
      expect(count('penaltyEnd')).toBe(result.servedPenalties.length);
   });
});
