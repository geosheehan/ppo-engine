import type { ParticipantCard, ParticipantLayout } from '@layout/types';
import '@components/PlayParticipants/PlayParticipants.css';
import { clsx } from 'clsx';
import PlayerCard from '@components/PlayerCard';

type PlayParticipantsProps = {
   layout?: ParticipantLayout<ParticipantCard>;
};

const NO_PARTICIPANTS: ParticipantLayout<ParticipantCard> = { lists: [], closeAtCenter: false };

function PlayParticipants({ layout = NO_PARTICIPANTS }: PlayParticipantsProps) {
   const { lists, closeAtCenter } = layout;

   return (
      <div className={clsx('play-participants', closeAtCenter && 'play-participants--close')}>
         {lists.map(({ position, cards }) => (
            <ol
               key={position}
               className={`play-participants__side play-participants__side--${position}`}
            >
               {cards.map(({ role, player, team, color, mirrored, apart }) => (
                  <li
                     key={`${role}-${player.playerId}`}
                     className={clsx(
                        'play-participants__card',
                        mirrored && 'play-participants__card--mirrored',
                        apart && 'play-participants__card--apart',
                     )}
                  >
                     <PlayerCard player={player} team={team} color={color} mirrored={mirrored} />
                     <div className="play-participants__role">{role}</div>
                  </li>
               ))}
            </ol>
         ))}
      </div>
   );
}

export default PlayParticipants;
