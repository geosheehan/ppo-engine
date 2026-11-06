import { describe, expect, it } from 'vitest';
import { GAME_VIEWS, gamePath, isGameView } from '@layout/routes';

describe('gamePath', () => {
   it('defaults to the replay view', () => {
      expect(gamePath('20261028-SEAvTOR')).toBe('/games/20261028-SEAvTOR/replay');
   });

   it('builds the path for a given view', () => {
      expect(gamePath('20261028-SEAvTOR', GAME_VIEWS.ANALYSIS)).toBe(
         '/games/20261028-SEAvTOR/analysis',
      );
   });
});

describe('isGameView', () => {
   it('accepts every game view', () => {
      for (const view of Object.values(GAME_VIEWS)) expect(isGameView(view)).toBe(true);
   });

   it('rejects unknown and missing views', () => {
      expect(isGameView('summary')).toBe(false);
      expect(isGameView('')).toBe(false);
      expect(isGameView(undefined)).toBe(false);
   });
});
