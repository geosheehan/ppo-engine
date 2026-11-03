import '@components/PlayParticipants.css';
import { useGame } from '@context/useGame.ts';
import { layoutParticipants } from '@domain/participantLayout.ts';
import type { ParticipantLayout } from '@domain/participantLayout.ts';
import { playParticipants } from '@domain/participants.ts';
import type { LineChange } from '@domain/steps.ts';
import type { Play, Player, Team } from '@domain/types.ts';
import type { Side } from '@engine/types.ts';
import PlayerCard from '@components/PlayerCard.tsx';

type PlayParticipantsProps = {
   play?: Play;
   lineChange?: LineChange;
   sides: [Side, Side];
};

type Card = { field: string; role: string; player: Player; team: Team; side: Side };

function PlayParticipants({ play, lineChange, sides }: PlayParticipantsProps) {
   const { game, playerById, teamById } = useGame();

   const cardsFor = (participants: { field: string; role: string; playerId: number }[]): Card[] =>
      participants.flatMap(({ field, role, playerId }) => {
         const player = playerById(playerId);
         const team = player && teamById(player.teamId);
         return player && team ? [{ field, role, player, team, side: team.id === game.homeTeam.id ? 'home' : 'away' }] : [];
      });

   let layout: ParticipantLayout<Card>;
   if (lineChange) {
      const changeCards = (ids: number[], role: string, mirrored: boolean) =>
         cardsFor(ids.map((playerId) => ({ field: role, role, playerId }))).map((card) => ({ ...card, mirrored, apart: false }));
      layout = {
         lists: [
            { position: 'left', cards: changeCards(lineChange.off, 'Off', true) },
            { position: 'right', cards: changeCards(lineChange.on, 'On', false) },
         ],
         closeAtCenter: false,
      };
   } else {
      layout = layoutParticipants(cardsFor(play ? playParticipants(play) : []), sides);
   }
   const { lists, closeAtCenter } = layout;

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
