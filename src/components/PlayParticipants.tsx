import '@components/PlayParticipants.css';
import { useGame } from '@context/GameContext.tsx';
import { playParticipants } from '@domain/participants.ts';
import type { Play } from '@domain/types.ts';
import PlayerCard from '@components/PlayerCard.tsx';

type PlayParticipantsProps = {
   play: Play;
};

function PlayParticipants({ play }: PlayParticipantsProps) {
   const { playerById, teamById } = useGame();

   const cards = [];
   for (const { role, playerId } of playParticipants(play)) {
      const player = playerById(playerId);
      const team = player && teamById(player.teamId);
      if (player && team) cards.push({ role, player, team });
   }

   return (
      <ol className="play-participants">
         {cards.map(({ role, player, team }) => (
            <li key={`${role}-${player.playerId}`} className="play-participants__card">
               <PlayerCard player={player} team={team} />
               <div className="play-participants__role">{role}</div>
            </li>
         ))}
      </ol>
   );
};

export default PlayParticipants;
