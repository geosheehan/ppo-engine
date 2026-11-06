import { describe, expect, it } from 'vitest';
import {
   axisX,
   compressedAxis,
   gameAxis,
   isBaseline,
   periodSpans,
   shootoutAttempts,
   strengthPieces,
} from '@layout/gameAxis';
import type { StrengthPiece } from '@layout/gameAxis';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { indexGame } from '@domain/game';
import type { Game } from '@domain/types';

const games = import.meta.glob<Game>('@data/games/*.json', { eager: true, import: 'default' });
const gameNamed = (id: string): Game => {
   const found = Object.entries(games).find(([path]) => path.includes(id));
   if (found === undefined) throw new Error(`No saved game ${id}`);
   return found[1];
};

const piece = (start: number, end: number, away: number, home: number): StrengthPiece => ({
   start,
   end,
   period: 1,
   strength: { away, home },
   baseline: 5,
});

describe('periodSpans', () => {
   it('ends overtime at its period-end play and leaves the shootout out', () => {
      const { plays } = indexGame(gameNamed('20261031-NSHvTBL'));
      expect(periodSpans(plays)).toEqual([
         { period: 1, start: 0, end: 1200 },
         { period: 2, start: 1200, end: 2400 },
         { period: 3, start: 2400, end: 3600 },
         { period: 4, start: 3600, end: 3900 },
      ]);
   });

   it('ends sudden-death overtime at the winning goal', () => {
      const { plays } = indexGame(gameNamed('20261029-MINvNYI'));
      expect(periodSpans(plays).at(-1)).toEqual({ period: 4, start: 3600, end: 3633 });
   });
});

describe('strengthPieces', () => {
   it('uses 3-on-3 as the baseline in regular-season overtime', () => {
      const index = indexGame(gameNamed('20261031-NSHvTBL'));
      const { timeline } = runPenaltyEngine(index);
      const overtime = strengthPieces(index.game, timeline, periodSpans(index.plays)).at(-1);
      expect(overtime).toMatchObject({ period: 4, start: 3600, end: 3900, baseline: 3 });
      expect(overtime !== undefined && isBaseline(overtime)).toBe(true);
   });

   it('covers every period without gaps', () => {
      const index = indexGame(gameNamed('20261028-SEAvTOR'));
      const pieces = strengthPieces(
         index.game,
         runPenaltyEngine(index).timeline,
         periodSpans(index.plays),
      );
      pieces.slice(1).forEach((current, i) => expect(current.start).toBe(pieces[i].end));
      expect([pieces[0].start, pieces.at(-1)?.end]).toEqual([0, 3600]);
   });
});

describe('shootoutAttempts', () => {
   it('lists every attempt in order and marks the goals', () => {
      const attempts = shootoutAttempts(indexGame(gameNamed('20261031-NSHvTBL')));
      expect(attempts).toHaveLength(8);
      expect(attempts.filter(({ goal }) => goal)).toHaveLength(1);
   });
});

describe('compressedAxis', () => {
   const pieces = [
      piece(0, 300, 5, 5),
      piece(300, 420, 5, 4),
      piece(420, 1000, 5, 5),
      piece(1000, 1120, 4, 5),
      piece(1120, 1200, 5, 5),
   ];
   const periods = [{ period: 1, start: 0, end: 1200 }];

   it('gives equal special-teams lengths equal widths', () => {
      const axis = compressedAxis(periods, pieces, []);
      const width = (start: number, end: number) => axisX(axis, end) - axisX(axis, start);
      expect(width(300, 420)).toBeCloseTo(width(1000, 1120));
   });

   it('caps the baseline at 30% of the width and fills the rest with special teams', () => {
      const axis = compressedAxis(periods, pieces, []);
      const baseline = pieces
         .filter(isBaseline)
         .reduce((sum, { start, end }) => sum + axisX(axis, end) - axisX(axis, start), 0);
      expect(baseline).toBeCloseTo(0.3);
      expect(axisX(axis, 1200)).toBeCloseTo(1);
   });

   it('keeps baseline pieces proportional to each other', () => {
      const axis = compressedAxis(periods, pieces, []);
      const longer = axisX(axis, 1000) - axisX(axis, 420);
      const shorter = axisX(axis, 300) - axisX(axis, 0);
      expect(longer).toBeGreaterThan(shorter);
   });

   it('reserves equal slots for the shootout after the timed game', () => {
      const attempts = Array.from({ length: 6 }, (_, i) => ({
         side: i % 2 === 0 ? ('away' as const) : ('home' as const),
         goal: false,
      }));
      const axis = compressedAxis(periods, pieces, attempts);
      const shootout = axis.shootout;
      expect(shootout).toBeDefined();
      if (shootout === undefined) return;
      expect(shootout.start + attempts.length * shootout.attemptWidth).toBeCloseTo(1);
      expect(axisX(axis, 1200)).toBeLessThan(shootout.start);
   });
});

describe('axisX', () => {
   it('clamps times outside the game to its ends', () => {
      const index = indexGame(gameNamed('20261028-SEAvTOR'));
      const axis = gameAxis(index, runPenaltyEngine(index).timeline);
      expect(axisX(axis, -10)).toBe(0);
      expect(axisX(axis, 9999)).toBeCloseTo(1);
   });
});
