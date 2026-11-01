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

type Card = { role: string; player: Player; team: Team };

function PlayParticipants({ play, sides }: PlayParticipantsProps) {
   const { game, playerById, teamById } = useGame();

   const cardsBySide: Record<Side, Card[]> = { away: [], home: [] };
   for (const { role, playerId } of playParticipants(play)) {
      const player = playerById(playerId);
      const team = player && teamById(player.teamId);
      if (player && team) cardsBySide[team.id === game.homeTeam.id ? 'home' : 'away'].push({ role, player, team });
   }

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

   const solo = cardsBySide.away.length + cardsBySide.home.length === 1;
   const lists = solo
      ? [{ position: 'solo', cards: [...cardsBySide.away, ...cardsBySide.home] }]
      : sides.map((side, i) => ({ position: i === 0 ? 'left' : 'right', cards: cardsBySide[side] }));

   return (
      <div className="play-participants">
         {lists.map(({ position, cards }) => (
            <ol key={position} className={`play-participants__side play-participants__side--${position}`}>
               {cards.map(({ role, player, team }) => (
                  <li key={`${role}-${player.playerId}`} className="play-participants__card">
                     <PlayerCard player={player} team={team} />
                     <div className="play-participants__role">{role}</div>
                  </li>
               ))}
            </ol>
         ))}
      </div>
   );
};

export default PlayParticipants;
