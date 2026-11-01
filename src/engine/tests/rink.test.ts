import { describe, expect, it } from 'vitest';
import type { Game } from '@domain/types';
import { boundToIce, CENTRE_DOT, CORNER_RADIUS, FACEOFF_DOTS, nearestFaceoffDot } from '@domain/rink';

const games = import.meta.glob<Game>('@data/games/*.json', { eager: true, import: 'default' });

type Located = { xCoord: number; yCoord: number };

describe('nearestFaceoffDot', () => {
   it('leaves a point on a dot where it is', () => {
      for (const dot of FACEOFF_DOTS) expect(nearestFaceoffDot(dot)).toEqual(dot);
   });

   it('snaps a point a few feet off to that dot', () => {
      expect(nearestFaceoffDot({ x: 71, y: -21 })).toEqual({ x: 69, y: -22 });
      expect(nearestFaceoffDot({ x: -18, y: 23 })).toEqual({ x: -20, y: 22 });
      expect(nearestFaceoffDot({ x: 1, y: -1 })).toEqual(CENTRE_DOT);
   });

   // Recorded faceoffs should all be close to a dot; a big jump would mean the snap picked the wrong one.
   it.each(Object.entries(games))('moves every faceoff in %s less than 3 ft', (_, game) => {
      for (const play of game.plays.filter((p) => p.typeDescKey === 'faceoff')) {
         const { xCoord: x, yCoord: y } = play.details as Located;
         const dot = nearestFaceoffDot({ x, y });
         expect(Math.hypot(dot.x - x, dot.y - y)).toBeLessThan(3);
      }
   });
});

describe('boundToIce', () => {
   // Distance from the inner rectangle (x ±72, y ±14.5); the ice is everything within 28 ft of it.
   const fromInner = ({ x, y }: { x: number; y: number }) =>
      Math.hypot(x - Math.max(-72, Math.min(72, x)), y - Math.max(-14.5, Math.min(14.5, y)));

   it('leaves points on the ice where they are', () => {
      for (const point of [CENTRE_DOT, { x: 99, y: 0 }, { x: 0, y: -42 }, { x: 89, y: 30 }]) {
         expect(boundToIce(point)).toEqual(point);
      }
   });

   it('pulls a point past the end boards straight back to them', () => {
      expect(boundToIce({ x: 104, y: 5 })).toEqual({ x: 100, y: 5 });
   });

   it('pulls a point past the side boards straight back to them', () => {
      expect(boundToIce({ x: -30, y: -45 })).toEqual({ x: -30, y: -42.5 });
   });

   it('pulls a corner point back toward the centre of that corner\'s curve', () => {
      const bounded = boundToIce({ x: 94, y: -38 });
      expect(fromInner(bounded)).toBeCloseTo(CORNER_RADIUS);
      // Same direction from the corner centre (72, -14.5) as the recorded point.
      expect((bounded.y + 14.5) / (bounded.x - 72)).toBeCloseTo((-38 + 14.5) / (94 - 72));
   });

   it.each(Object.entries(games))('keeps every located play in %s on the ice', (_, game) => {
      for (const play of game.plays) {
         const { xCoord: x, yCoord: y } = (play.details ?? {}) as Partial<Located>;
         if (x === undefined || y === undefined) continue;
         expect(fromInner(boundToIce({ x, y }))).toBeLessThanOrEqual(CORNER_RADIUS + 1e-9);
      }
   });
});
