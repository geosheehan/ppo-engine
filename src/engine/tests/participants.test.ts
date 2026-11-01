import { describe, expect, it } from 'vitest';
import type { Game, Play } from '@domain/types';
import { playParticipants } from '@domain/participants';

const games = import.meta.glob<Game>('@data/games/*.json', { eager: true, import: 'default' });

const play = (typeDescKey: string, details: Record<string, unknown>) => ({ typeDescKey, details }) as unknown as Play;

describe('playParticipants', () => {
   it('lists a goal\'s scorer, assists and goalie in order', () => {
      expect(playParticipants(play('goal', { scoringPlayerId: 1, assist1PlayerId: 2, assist2PlayerId: 3, goalieInNetId: 4 })))
         .toEqual([
            { role: 'Goal', playerId: 1 },
            { role: '1st assist', playerId: 2 },
            { role: '2nd assist', playerId: 3 },
            { role: 'Goalie', playerId: 4 },
         ]);
   });

   it('skips roles the play doesn\'t have', () => {
      expect(playParticipants(play('goal', { scoringPlayerId: 1 }))).toEqual([{ role: 'Goal', playerId: 1 }]);
   });

   it('names nobody for plays without players', () => {
      expect(playParticipants(play('stoppage', {}))).toEqual([]);
      expect(playParticipants(play('period-start', {}))).toEqual([]);
   });

   it.each(Object.entries(games))('finds every named player in %s on the roster', (_, game) => {
      const roster = new Set(game.rosterSpots.map((player) => player.playerId));
      for (const p of game.plays) {
         for (const { playerId } of playParticipants(p)) expect(roster).toContain(playerId);
      }
   });
});
