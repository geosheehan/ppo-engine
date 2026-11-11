import { describe, expect, it } from 'vitest';
import { playParticipantLayout } from '@layout/participantLayout';
import { participantRoles, rolesLine } from '@layout/participantRoles';
import type { LineChange, Play, Player, Side, Team } from '@domain/types';

const HOME = 10;
const AWAY = 20;

const player = (playerId: number, teamId: number, sweaterNumber: number) =>
   ({ playerId, teamId, sweaterNumber }) as Player;

const players = new Map(
   [
      player(1, HOME, 7),
      player(2, HOME, 88),
      player(3, HOME, 8),
      player(4, AWAY, 31),
      player(5, AWAY, 46),
      player(6, AWAY, 2),
   ].map((p) => [p.playerId, p]),
);

const lookups = {
   playerById: (id: number) => players.get(id),
   teamById: (id: number) => ({ id }) as Team,
   sideOf: (id: number): Side => (id === HOME ? 'home' : 'away'),
   teamColor: () => '#000000',
};

const homeOnLeft: [Side, Side] = ['home', 'away'];

describe('participantRoles', () => {
   it('lists a goal in the play order even though the layout moves the scorer', () => {
      const goal = {
         typeDescKey: 'goal',
         details: { scoringPlayerId: 1, assist1PlayerId: 2, assist2PlayerId: 3, goalieInNetId: 4 },
      } as unknown as Play;
      const layout = playParticipantLayout(lookups, goal, undefined, homeOnLeft);

      expect(rolesLine(participantRoles(layout))).toBe(
         'Goal #7 · 1st assist #88 · 2nd assist #8 · Goalie #31',
      );
   });

   it('names Off and On once each in a line change, with everyone coming off first', () => {
      const faceoff = { typeDescKey: 'faceoff', details: {} } as unknown as Play;
      const layout = playParticipantLayout(
         lookups,
         faceoff,
         { off: [5, 6], on: [2, 3] } satisfies LineChange,
         homeOnLeft,
      );

      expect(participantRoles(layout)).toEqual([
         { role: 'Off', numbers: [46, 2] },
         { role: 'On', numbers: [88, 8] },
      ]);
      expect(rolesLine(participantRoles(layout))).toBe('Off #46 #2 · On #88 #8');
   });

   it('is empty for a play without named players', () => {
      const stoppage = { typeDescKey: 'stoppage', details: {} } as unknown as Play;

      expect(
         participantRoles(playParticipantLayout(lookups, stoppage, undefined, homeOnLeft)),
      ).toEqual([]);
   });
});
