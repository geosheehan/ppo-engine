import { describe, expect, it } from 'vitest';
import type { Game } from '@domain/types';
import { CENTRE_DOT, FACEOFF_DOTS, nearestFaceoffDot } from '@domain/rink';

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
