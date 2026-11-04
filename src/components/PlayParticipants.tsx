import '@components/PlayParticipants.css';
import { clsx } from 'clsx';
import { useGame } from '@context/useGame';
import { layoutParticipants } from '@layout/participantLayout';
import type { ParticipantLayout } from '@layout/participantLayout';
import { playParticipants } from '@domain/participants';
import type { LineChange } from '@domain/steps';
import type { Play, Player, Side, Team } from '@domain/types';
import PlayerCard from '@components/PlayerCard';

type PlayParticipantsProps = {
   play?: Play;
   lineChange?: LineChange;
   sides: [Side, Side];
};

type Card = { field: string; role: string; player: Player; team: Team; side: Side };

function PlayParticipants({ play, lineChange, sides }: PlayParticipantsProps) {
   const { playerById, sideOf, teamById } = useGame();

   const cardsFor = (participants: { field: string; role: string; playerId: number }[]): Card[] =>
      participants.flatMap(({ field, role, playerId }) => {
         const player = playerById(playerId);
         const team = player && teamById(player.teamId);
         return player && team ? [{ field, role, player, team, side: sideOf(team.id) }] : [];
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
      <div className={clsx('play-participants', closeAtCenter && 'play-participants--close')}>
         {lists.map(({ position, cards }) => (
            <ol key={position} className={`play-participants__side play-participants__side--${position}`}>
               {cards.map(({ role, player, team, mirrored, apart }) => (
                  <li
                     key={`${role}-${player.playerId}`}
                     className={clsx(
                        'play-participants__card',
                        mirrored && 'play-participants__card--mirrored',
                        apart && 'play-participants__card--apart',
                     )}
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
