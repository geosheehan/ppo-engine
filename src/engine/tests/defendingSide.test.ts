import { describe, expect, it } from 'vitest';
import type { Game } from '@domain/types';
import { homeDefendingSides } from '@engine/defendingSide';

// Every saved game, keyed by path from the project root (e.g. /src/data/games/20261028-TORvSEA.json).
const games = import.meta.glob<Game>('@data/games/*.json', { eager: true, import: 'default' });

const recordedSides = (game: Game) =>
   new Map(game.plays.filter((play) => play.homeTeamDefendingSide).map((play) => [play.periodDescriptor.number, play.homeTeamDefendingSide]));

const withoutRecordedSides = (game: Game): Game => ({
   ...game,
   plays: game.plays.map((play) => ({ ...play, homeTeamDefendingSide: undefined })),
});

describe('homeDefendingSides', () => {
   const recorded = Object.entries(games).filter(([, game]) => recordedSides(game).size > 0);

   it.each(recorded)('uses the recorded sides in %s', (_, game) => {
      expect(homeDefendingSides(game)).toEqual(recordedSides(game));
   });

   it.each(recorded)('infers the recorded sides from zone and location in %s', (_, game) => {
      expect(homeDefendingSides(withoutRecordedSides(game))).toEqual(recordedSides(game));
   });

   it('infers the sides for a game with none recorded', () => {
      const game = games['/src/data/games/20110211-NYIvPIT.json'];
      expect(homeDefendingSides(game)).toEqual(new Map([[1, 'right'], [2, 'left'], [3, 'right']]));
   });
});
