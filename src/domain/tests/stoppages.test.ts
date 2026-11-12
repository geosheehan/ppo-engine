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

   it("names a team's time-out by its tricode", () => {
      expect(stoppageDetail(details('visitor-timeout'), abbrevs)).toBe('TOR time-out');
      expect(stoppageDetail(details('home-timeout'), abbrevs)).toBe('CHI time-out');
   });

   it("names a team's coach's challenge by its tricode", () => {
      expect(stoppageDetail(details('chlg-vis-goal-interference'), abbrevs)).toBe(
         'TOR Challenge: Goalkeeper interference',
      );
      expect(stoppageDetail(details('chlg-hm-puck-over-glass'), abbrevs)).toBe(
         'CHI Challenge: Puck over the glass',
      );
   });

   it('hides a secondary reason that repeats the main one', () => {
      expect(stoppageDetail(details('visitor-timeout', 'visitor-timeout'), abbrevs)).toBe(
         'TOR time-out',
      );
   });

   it('never shows a TV time-out as the secondary reason', () => {
      expect(stoppageDetail(details('goalie-stopped-after-sog', 'tv-timeout'))).toBe(
         'Goalkeeper froze the puck',
      );
   });

   it("always shows a team's time-out as the secondary reason", () => {
      expect(stoppageDetail(details('icing', 'visitor-timeout'), abbrevs)).toBe(
         'Icing | TOR time-out',
      );
   });

   it('hides other secondary reasons after a normal stoppage', () => {
      expect(stoppageDetail(details('high-stick', 'video-review'))).toBe('High-sticking the puck');
   });

   it('shows the secondary reason in place of referee or linesman', () => {
      expect(stoppageDetail(details('referee-or-linesman', 'player-injury'))).toBe(
         'Injured player',
      );
      expect(stoppageDetail(details('referee-or-linesman', 'tv-timeout'))).toBe('TV time-out');
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
