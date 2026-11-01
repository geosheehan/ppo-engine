import '@components/PlayParticipants.css';
import { useGame } from '@context/GameContext.tsx';
import { playParticipants } from '@domain/participants.ts';
import type { Play, Player, Team } from '@domain/types.ts';
import type { Side } from '@engine/types.ts';
import { layoutParticipants } from '@components/participantLayout.ts';
import PlayerCard from '@components/PlayerCard.tsx';

type PlayParticipantsProps = {
   play: Play;
   sides: [Side, Side];
};

type Card = { field: string; role: string; player: Player; team: Team; side: Side };

function PlayParticipants({ play, sides }: PlayParticipantsProps) {
   const { game, playerById, teamById } = useGame();

   const cards: Card[] = [];
   for (const { field, role, playerId } of playParticipants(play)) {
      const player = playerById(playerId);
      const team = player && teamById(player.teamId);
      if (player && team) cards.push({ field, role, player, team, side: team.id === game.homeTeam.id ? 'home' : 'away' });
   }
   const { lists, closeAtCenter } = layoutParticipants(cards, sides);

   return (
      <div className={`play-participants${closeAtCenter ? ' play-participants--close' : ''}`}>
         {lists.map(({ position, cards }) => (
            <ol key={position} className={`play-participants__side play-participants__side--${position}`}>
               {cards.map(({ role, player, team, mirrored, apart }) => (
                  <li
                     key={`${role}-${player.playerId}`}
                     className={['play-participants__card', mirrored && 'play-participants__card--mirrored', apart && 'play-participants__card--apart']
                        .filter(Boolean)
                        .join(' ')}
                  >
                     <PlayerCard player={player} team={team} mirrored={mirrored} />
                     <div className="play-participants__role">{role}</div>
                  </li>
               ))}
            </ol>
         ))}
      </div>
   );
};

export default PlayParticipants;
