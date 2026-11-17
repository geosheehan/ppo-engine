import { describe, expect, it } from 'vitest';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { expectOneClockPerPlayer } from '@engine/tests/oneClock';
import { indexGame } from '@domain/game';
import type { Game } from '@domain/types';

const games = import.meta.glob<Game>('@data/games/*.json', { eager: true, import: 'default' });

describe('one player, one penalty clock at a time', () => {
   it.each(Object.entries(games).map(([path, game]) => [path.split('/').pop()!, game] as const))(
      '%s',
      (_, game) => {
         const index = indexGame(game);
         expectOneClockPerPlayer(index, runPenaltyEngine(index));
      },
   );
});

describe('no saved game discards a penalty to a player in the box', () => {
   it.each(Object.entries(games).map(([path, game]) => [path.split('/').pop()!, game] as const))(
      '%s',
      (_, game) => {
         const { discardedPenalties } = runPenaltyEngine(indexGame(game));
         expect(
            discardedPenalties.filter(({ reason }) => reason === 'notMinorToPlayerInBox'),
         ).toEqual([]);
      },
   );
});
