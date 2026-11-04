import { describe, expect, it } from 'vitest';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { strengthAt } from '@engine/strength';
import { indexGame } from '@domain/game';
import { playTime } from '@domain/plays';
import type { Game } from '@domain/types';

// Every saved game, keyed by path from the project root (e.g. /src/data/games/20261028-SEAvTOR.json).
const games = import.meta.glob<Game>('@data/games/*.json', { eager: true, import: 'default' });

// Plays that happen during live play. Penalty and stoppage plays at big stoppages carry
// mid-entry situation codes, so they aren't a reliable record of on-ice strength.
const IN_PLAY = new Set([
   'shot-on-goal',
   'missed-shot',
   'blocked-shot',
   'hit',
   'giveaway',
   'takeaway',
   'goal',
]);

// situationCode is [away goalie][away skaters][home skaters][home goalie]; a pulled goalie adds an attacker.
function recordedStrength(code: string) {
   const [awayGoalie, awaySkaters, homeSkaters, homeGoalie] = code.split('').map(Number);
   return {
      away: awaySkaters - (awayGoalie === 0 ? 1 : 0),
      home: homeSkaters - (homeGoalie === 0 ? 1 : 0),
   };
}

describe.each(Object.entries(games).map(([path, game]) => [path.split('/').pop()!, game] as const))(
   '%s',
   (_, game) => {
      const { timeline } = runPenaltyEngine(indexGame(game));

      const checked = game.plays.filter(
         (play) =>
            IN_PLAY.has(play.typeDescKey)
            && play.periodDescriptor.periodType !== 'SO'
            && play.situationCode !== undefined
            && !play.situationCode.slice(1, 3).includes('0'),
      );

      it.each(
         checked.map(
            (play) =>
               [play.typeDescKey, play.periodDescriptor.number, play.timeInPeriod, play] as const,
         ),
      )('matches the recorded strength at %s, P%i %s', (_kind, _period, _clock, play) => {
         // The clock only has whole seconds, so a shot in the same second a penalty starts or ends
         // may have happened on either side of the change.
         const time = playTime(play);
         expect([strengthAt(timeline, time), strengthAt(timeline, time - 0.5)]).toContainEqual(
            recordedStrength(play.situationCode!),
         );
      });
   },
);
