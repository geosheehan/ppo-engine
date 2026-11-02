import { describe, expect, it } from 'vitest';
import { keepSlots } from '@domain/lineup';
import type { Player } from '@domain/types';

const player = (sweaterNumber: number, positionCode: string) =>
   ({ playerId: sweaterNumber, sweaterNumber, positionCode }) as Player;

const numbers = (players: Player[]) => players.map(({ sweaterNumber }) => sweaterNumber);

const C34 = player(34, 'C');
const L24 = player(24, 'L');
const R88 = player(88, 'R');
const D22 = player(22, 'D');
const D44 = player(44, 'D');
const D28 = player(28, 'D');
const D43 = player(43, 'D');
const L92 = player(92, 'L');

describe('keepSlots', () => {
   const lineup = [L24, C34, R88, D28, D44];

   it('puts the player coming on in the slot of the one going off', () => {
      expect(numbers(keepSlots(lineup, [L24, C34, R88, D43, D44]))).toEqual([24, 34, 88, 43, 44]);
   });

   it('keeps an earlier arrival in its slot when the next change sorts lower', () => {
      const afterFirst = keepSlots(lineup, [L24, C34, R88, D43, D44]);
      expect(numbers(keepSlots(afterFirst, [L24, C34, R88, D43, D22]))).toEqual([24, 34, 88, 43, 22]);
   });

   it('matches a forward to a forward\'s slot when a forward and a defenseman change together', () => {
      expect(numbers(keepSlots(lineup, [L92, C34, R88, D43, D44]))).toEqual([92, 34, 88, 43, 44]);
   });

   it('sorts a whole new group by position', () => {
      expect(numbers(keepSlots(lineup, [D43, D22, L92]))).toEqual([92, 22, 43]);
   });

   it('closes up the gap when a player goes off with no one coming on', () => {
      expect(numbers(keepSlots(lineup, [L24, R88, D28, D44]))).toEqual([24, 88, 28, 44]);
   });

   it('adds an extra forward after the other forwards and an extra defenseman after the defense', () => {
      const shortHanded = [C34, R88, D28, D44];
      expect(numbers(keepSlots(shortHanded, [C34, R88, L92, D28, D44]))).toEqual([34, 88, 92, 28, 44]);
      expect(numbers(keepSlots([C34, R88, D28], [C34, R88, D28, D44]))).toEqual([34, 88, 28, 44]);
   });
});
