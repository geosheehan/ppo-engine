import '@components/PlayParticipants.css';
import { useGame } from '@context/GameContext.tsx';
import { playParticipants } from '@domain/participants.ts';
import type { Play, Player, Team } from '@domain/types.ts';
import type { Side } from '@engine/types.ts';
import PlayerCard from '@components/PlayerCard.tsx';

type PlayParticipantsProps = {
   play: Play;
   sides: Side[];
};

type Card = { role: string; player: Player; team: Team; side: Side };

function PlayParticipants({ play, sides }: PlayParticipantsProps) {
   const { game, playerById, teamById } = useGame();

   const cardsBySide: Record<Side, Card[]> = { away: [], home: [] };
   for (const { role, playerId } of playParticipants(play)) {
      const player = playerById(playerId);
      const team = player && teamById(player.teamId);
      if (!player || !team) continue;
      const side = team.id === game.homeTeam.id ? 'home' : 'away';
      cardsBySide[side].push({ role, player, team, side });
   }
   const bothTeams = cardsBySide.away.length > 0 && cardsBySide.home.length > 0;

   // A goal with two assists names three scoring-team players. The scorer moves across to the goalie's half,
   // nearest the center line, so each half holds two cards and the assists keep the scoring side.
   // Likewise, when every participant is on one team, one card crosses so the cards stay centered. For a shot
   // blocked by a teammate the blocker crosses, taking the defender's side; otherwise the first card does.
   for (const side of ['home', 'away'] as const) {
      const otherSide = side === 'home' ? 'away' : 'home';
      const cards = cardsBySide[side];
      const oneTeam = cards.length >= 2 && cardsBySide[otherSide].length === 0;
      if (cards.length <= 2 && !oneTeam) continue;
      const blocker = cards.findIndex(({ role }) => role === 'Blocked');
      const [moved] = cards.splice(oneTeam && blocker !== -1 ? blocker : 0, 1);
      cardsBySide[otherSide].unshift(moved);
   }

   const isMirrored = (card: Card, position: string): boolean =>
      position !== 'solo' && (bothTeams ? card.side === sides[0] : position === 'left');

   const solo = cardsBySide.away.length + cardsBySide.home.length === 1;
   const lists = (solo
      ? [{ position: 'solo', cards: [...cardsBySide.away, ...cardsBySide.home] }]
      : sides.map((side, i) => ({ position: i === 0 ? 'left' : 'right', cards: cardsBySide[side] }))
   ).map(({ position, cards }) => ({
      position,
      cards: cards.map((card) => ({ ...card, mirrored: isMirrored(card, position) })),
   }));

   type PlacedCard = (typeof lists)[number]['cards'][number];
   const facing = (left: PlacedCard, right: PlacedCard): boolean => left.mirrored && !right.mirrored;
   const [leftCards, rightCards] = lists.map(({ cards }) => cards);
   const closeAtCenter = !solo && leftCards.length > 0 && rightCards.length > 0 && !facing(leftCards[0], rightCards[0]);
   const apartFromInner = (position: string, cards: PlacedCard[], i: number): boolean =>
      i > 0 && (position === 'left' ? facing(cards[i], cards[i - 1]) : facing(cards[i - 1], cards[i]));

   return (
      <div className={`play-participants${closeAtCenter ? ' play-participants--close' : ''}`}>
         {lists.map(({ position, cards }) => (
            <ol key={position} className={`play-participants__side play-participants__side--${position}`}>
               {cards.map(({ role, player, team, mirrored }, i) => {
                  const modifiers = [mirrored && 'mirrored', apartFromInner(position, cards, i) && 'apart']
                     .filter(Boolean)
                     .map((modifier) => ` play-participants__card--${modifier}`)
                     .join('');
                  return (
                     <li key={`${role}-${player.playerId}`} className={`play-participants__card${modifiers}`}>
                        <PlayerCard player={player} team={team} mirrored={mirrored} />
                        <div className="play-participants__role">{role}</div>
                     </li>
                  );
               })}
            </ol>
         ))}
      </div>
   );
};

export default PlayParticipants;
