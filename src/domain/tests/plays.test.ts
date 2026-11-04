import { describe, expect, it } from 'vitest';
import {
   byGameOrder,
   delayedPenaltyCall,
   featuredPlayerId,
   isGoal,
   runningScores,
} from '@domain/plays';
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

describe('featuredPlayerId', () => {
   const withDetails = (typeDescKey: string, details: object) =>
      ({ typeDescKey, details }) as unknown as Play;

   it('names the player who committed a penalty', () => {
      expect(
         featuredPlayerId(withDetails('penalty', { committedByPlayerId: 1, servedByPlayerId: 2 })),
      ).toBe(1);
   });

   it('falls back to the player serving a penalty nobody committed', () => {
      expect(featuredPlayerId(withDetails('penalty', { servedByPlayerId: 2 }))).toBe(2);
   });

   it('names the scorer of a goal', () => {
      expect(featuredPlayerId(withDetails('goal', { scoringPlayerId: 3 }))).toBe(3);
   });

   it('names nobody for other plays', () => {
      expect(featuredPlayerId(withDetails('faceoff', {}))).toBeUndefined();
   });
});

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
      'finds a penalty by the same team for every delayed penalty in %s, unless the other team scores first',
      (_, game) => {
         const plays = game.plays.toSorted(byGameOrder);
         plays.forEach((p, i) => {
            if (p.typeDescKey !== 'delayed-penalty') return;
            const team = (p.details as { eventOwnerTeamId: number }).eventOwnerTeamId;
            const called = delayedPenaltyCall(plays, i);
            if (called !== undefined) {
               expect(called.details.eventOwnerTeamId).toBe(team);
               return;
            }
            const nextFaceoff = plays.findIndex((q, j) => j > i && q.typeDescKey === 'faceoff');
            const beforeFaceoff = plays.slice(i + 1, nextFaceoff === -1 ? undefined : nextFaceoff);
            expect(
               beforeFaceoff.some((q) => isGoal(q) && q.details.eventOwnerTeamId !== team),
            ).toBe(true);
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
