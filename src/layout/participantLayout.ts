import type { LayoutCard, ParticipantLayout, PlacedCard } from '@layout/types';
import { otherSide } from '@domain/game';
import type { Side } from '@domain/types';

// A mirrored card faces right. The wide gap goes between two cards that face each other.
const facing = (leftMirrored: boolean, rightMirrored: boolean): boolean =>
   leftMirrored && !rightMirrored;

// Places a play's participant cards either side of the center line. Each half lists its cards from the center
// line outward.
export function layoutParticipants<C extends LayoutCard>(
   cards: C[],
   [leftSide, rightSide]: [Side, Side],
): ParticipantLayout<C> {
   if (cards.length === 1) {
      return {
         lists: [
            {
               position: 'solo',
               cards: [{ ...cards[0], mirrored: false, apart: false }],
            },
         ],
         closeAtCenter: false,
      };
   }

   const cardsBySide: Record<Side, C[]> = { away: [], home: [] };
   for (const card of cards) cardsBySide[card.side].push(card);
   const bothTeams = cardsBySide.away.length > 0 && cardsBySide.home.length > 0;

   // A goal with two assists names three scoring-team players. The scorer moves across to the goalie's half,
   // nearest the center line, so each half holds two cards. When every participant is on one team, one card
   // crosses so the cards stay centered: the blocker of a shot blocked by a teammate, otherwise the first card.
   for (const side of [leftSide, rightSide]) {
      const halfCards = cardsBySide[side];
      const oneTeam = !bothTeams && halfCards.length >= 2;
      if (halfCards.length <= 2 && !oneTeam) continue;
      const blocker = halfCards.findIndex(({ field }) => field === 'blockingPlayerId');
      const [moved] = halfCards.splice(oneTeam && blocker !== -1 ? blocker : 0, 1);
      cardsBySide[otherSide(side)].unshift(moved);
   }

   // Cards face their opponents: the left team's cards face right, even after crossing the center line, so a
   // goal with two assists reads as three on one. When only one team is involved, the halves face each other.
   const place = (position: 'left' | 'right', side: Side): PlacedCard<C>[] => {
      const half = cardsBySide[side];
      const mirrored = half.map((card) =>
         bothTeams ? card.side === leftSide : position === 'left',
      );
      return half.map((card, i) => ({
         ...card,
         mirrored: mirrored[i],
         apart:
            i > 0
            && (position === 'left'
               ? facing(mirrored[i], mirrored[i - 1])
               : facing(mirrored[i - 1], mirrored[i])),
      }));
   };
   const left = place('left', leftSide);
   const right = place('right', rightSide);

   return {
      lists: [
         { position: 'left', cards: left },
         { position: 'right', cards: right },
      ],
      closeAtCenter:
         left.length > 0 && right.length > 0 && !facing(left[0].mirrored, right[0].mirrored),
   };
}
