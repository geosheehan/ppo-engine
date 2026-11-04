import { describe, expect, it } from 'vitest';
import { byGameOrder, delayedPenaltyCall, runningScores } from '@domain/plays';
import type { Game, Play } from '@domain/types';

const games = import.meta.glob<Game>('@data/games/*.json', { eager: true, import: 'default' });

const SEA = 55;
const TOR = 10;

const TYPE_CODES: Record<string, number> = { penalty: 509, goal: 505, faceoff: 502 };

const play = (typeDescKey: string, eventOwnerTeamId?: number) =>
   ({
      typeDescKey,
      typeCode: TYPE_CODES[typeDescKey] ?? 0,
      details: { eventOwnerTeamId },
   }) as unknown as Play;

describe('delayedPenaltyCall', () => {
   it('finds the penalty called on the same team once play stops', () => {
      const called = play('penalty', SEA);
      const plays = [
         play('delayed-penalty', SEA),
         play('giveaway', TOR),
         called,
         play('faceoff', TOR),
      ];
      expect(delayedPenaltyCall(plays, 0)).toBe(called);
   });

   it('skips a penalty to the other team', () => {
      const called = play('penalty', SEA);
      const plays = [
         play('delayed-penalty', SEA),
         play('penalty', TOR),
         called,
         play('faceoff', TOR),
      ];
      expect(delayedPenaltyCall(plays, 0)).toBe(called);
   });

   it('finds nothing when a goal washes the penalty out before the faceoff', () => {
      const plays = [
         play('delayed-penalty', SEA),
         play('goal', TOR),
         play('faceoff', SEA),
         play('penalty', SEA),
      ];
      expect(delayedPenaltyCall(plays, 0)).toBeUndefined();
   });

   it('finds nothing when the game ends first', () => {
      expect(
         delayedPenaltyCall([play('delayed-penalty', SEA), play('period-end')], 0),
      ).toBeUndefined();
   });

   it.each(Object.entries(games))(
      'finds a penalty by the same team for every delayed penalty in %s',
      (_, game) => {
         const plays = game.plays.toSorted(byGameOrder);
         plays.forEach((p, i) => {
            if (p.typeDescKey !== 'delayed-penalty') return;
            const called = delayedPenaltyCall(plays, i);
            expect(called?.details.eventOwnerTeamId).toBe(
               (p.details as { eventOwnerTeamId: number }).eventOwnerTeamId,
            );
         });
      },
   );
});

describe('runningScores', () => {
   const goal = (awayScore: number, homeScore: number) =>
      ({
         typeDescKey: 'goal',
         typeCode: 505,
         details: { awayScore, homeScore },
      }) as unknown as Play;

   it('carries the score from each goal forward to every later play', () => {
      const plays = [
         play('faceoff', SEA),
         goal(0, 1),
         play('hit', TOR),
         goal(1, 1),
         play('faceoff', TOR),
      ];
      expect(runningScores(plays)).toEqual([
         { away: 0, home: 0 },
         { away: 0, home: 1 },
         { away: 0, home: 1 },
         { away: 1, home: 1 },
         { away: 1, home: 1 },
      ]);
   });
});
