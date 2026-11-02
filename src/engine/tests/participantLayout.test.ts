import { describe, expect, it } from 'vitest';
import { layoutParticipants } from '@domain/participantLayout';
import type { ParticipantLayout, PlacedCard } from '@domain/participantLayout';
import type { Side } from '@engine/types';

type TestCard = { name: string; field: string; side: Side };

const card = (name: string, side: Side, field = name): TestCard => ({ name, field, side });

// Draws a layout left to right. "Goal>" faces right and "<Goal" faces left; " | " is a wide gap, " " a narrow one.
const picture = ({ lists, closeAtCenter }: ParticipantLayout<TestCard>): string => {
   const name = ({ name, mirrored }: PlacedCard<TestCard>) => (mirrored ? `${name}>` : `<${name}`);
   const gap = (wide: boolean) => (wide ? ' | ' : ' ');
   const [first, second] = lists;
   if (first.position === 'solo') return `(${first.cards[0].name})`;
   const left = first.cards.map((c, i) => (i > 0 ? name(c) + gap(c.apart) : name(c))).reverse().join('');
   const right = second.cards.map((c, i) => (i > 0 ? gap(c.apart) + name(c) : name(c))).join('');
   return left + gap(!closeAtCenter) + right;
};

const homeOnLeft: [Side, Side] = ['home', 'away'];

describe('layoutParticipants', () => {
   it('centers a lone participant', () => {
      expect(picture(layoutParticipants([card('Penalty', 'home')], homeOnLeft))).toBe('(Penalty)');
   });

   it('faces two opponents across the center line', () => {
      expect(picture(layoutParticipants([card('Won', 'home'), card('Lost', 'away')], homeOnLeft))).toBe('Won> | <Lost');
   });

   it('keeps a goal with one assist on the scoring side', () => {
      const cards = [card('Goal', 'home'), card('1st', 'home'), card('Goalie', 'away')];
      expect(picture(layoutParticipants(cards, homeOnLeft))).toBe('1st> Goal> | <Goalie');
   });

   it('shows a goal with two assists as three on one when the scoring team is on the right', () => {
      const cards = [card('Goal', 'away'), card('1st', 'away'), card('2nd', 'away'), card('Goalie', 'home')];
      expect(picture(layoutParticipants(cards, homeOnLeft))).toBe('Goalie> | <Goal <1st <2nd');
   });

   it('shows a goal with two assists as three on one when the scoring team is on the left', () => {
      const cards = [card('Goal', 'home'), card('1st', 'home'), card('2nd', 'home'), card('Goalie', 'away')];
      expect(picture(layoutParticipants(cards, homeOnLeft))).toBe('2nd> 1st> Goal> | <Goalie');
   });

   it('moves the blocker of a shot blocked by a teammate to the other half, facing the shooter', () => {
      const cards = [card('Shot', 'away'), card('Blocked', 'away', 'blockingPlayerId')];
      expect(picture(layoutParticipants(cards, homeOnLeft))).toBe('Blocked> | <Shot');
   });

   it('moves the first card across when one team is involved without a blocker', () => {
      const cards = [card('Penalty', 'away'), card('Served', 'away')];
      expect(picture(layoutParticipants(cards, homeOnLeft))).toBe('Penalty> | <Served');
   });

   it('mirrors by team, not by half, when the away team is on the left', () => {
      const cards = [card('Goal', 'home'), card('1st', 'home'), card('2nd', 'home'), card('Goalie', 'away')];
      expect(picture(layoutParticipants(cards, ['away', 'home']))).toBe('Goalie> | <Goal <1st <2nd');
   });
});
