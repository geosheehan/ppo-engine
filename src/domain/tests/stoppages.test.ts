import { describe, expect, it, vi } from 'vitest';
import { isStoppage } from '@domain/plays';
import { STOPPAGE_REASON_NAMES, stoppageDetail, stoppageReasonName } from '@domain/stoppages';
import type { Game, StoppageDetails } from '@domain/types';

const games = import.meta.glob<Game>('@data/games/*.json', { eager: true, import: 'default' });

const details = (reason: string, secondaryReason?: string) =>
   ({ reason, secondaryReason }) as StoppageDetails;

const abbrevs = { away: 'TOR', home: 'CHI' };

describe('stoppageDetail', () => {
   it('names the reason', () => {
      expect(stoppageDetail(details('icing'))).toBe('Icing');
   });

   it("names a team's timeout by its tricode", () => {
      expect(stoppageDetail(details('visitor-timeout'), abbrevs)).toBe('TOR timeout');
      expect(stoppageDetail(details('home-timeout'), abbrevs)).toBe('CHI timeout');
   });

   it('hides a secondary reason that repeats the main one', () => {
      expect(stoppageDetail(details('visitor-timeout', 'visitor-timeout'), abbrevs)).toBe(
         'TOR timeout',
      );
   });

   it('never shows a TV timeout as the secondary reason', () => {
      expect(stoppageDetail(details('goalie-stopped-after-sog', 'tv-timeout'))).toBe(
         'Goalkeeper froze the puck',
      );
   });

   it("always shows a team's timeout as the secondary reason", () => {
      expect(stoppageDetail(details('icing', 'visitor-timeout'), abbrevs)).toBe(
         'Icing | TOR timeout',
      );
   });

   it('hides other secondary reasons after a normal stoppage', () => {
      expect(stoppageDetail(details('high-stick', 'video-review'))).toBe('High stick');
   });

   it('shows the secondary reason in place of referee or linesman', () => {
      expect(stoppageDetail(details('referee-or-linesman', 'player-injury'))).toBe('Player injury');
      expect(stoppageDetail(details('referee-or-linesman', 'tv-timeout'))).toBe('TV timeout');
   });

   it('shows nothing for referee or linesman without a secondary reason', () => {
      expect(stoppageDetail(details('referee-or-linesman'))).toBe('');
   });
});

describe('stoppageReasonName', () => {
   it('falls back to the key as words and reports it', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(stoppageReasonName('puck-on-roof')).toBe('Puck on roof');
      expect(error).toHaveBeenCalledOnce();
      error.mockRestore();
   });

   it('has a name for every stoppage reason in the saved games', () => {
      const reasons = new Set(
         Object.values(games)
            .flatMap((game) => game.plays)
            .filter(isStoppage)
            .flatMap(({ details }) =>
               details.secondaryReason === undefined
                  ? [details.reason]
                  : [details.reason, details.secondaryReason],
            ),
      );
      expect([...reasons].filter((reason) => !(reason in STOPPAGE_REASON_NAMES))).toEqual([]);
   });
});
