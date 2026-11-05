import '@components/PlayerCard/PlayerCard.css';
import { clsx } from 'clsx';
import { useHeadshot } from '@hooks/useHeadshot';
import placeholderHeadshot from '@assets/placeholder-headshot.png';
import type { Player, Team } from '@domain/types';

type PlayerCardProps = {
   player?: Player;
   team?: Team;
   color?: string;
   mirrored?: boolean;
};

function PlayerCard({ player, team, color, mirrored = false }: PlayerCardProps) {
   const headshot = useHeadshot(player?.headshot);

   return (
      <div className={clsx('player-card', mirrored && 'player-card--mirrored')}>
         <img
            className="player-card__headshot"
            src={headshot ?? placeholderHeadshot}
            alt=""
            style={color !== undefined ? { '--team-color': color } : undefined}
         />
         <div className="player-card__info">
            <div className="player-card__meta">
               {team?.abbrev}
               {player && (
                  <>
                     {' '}
                     #{player.sweaterNumber} · {player.positionCode}
                  </>
               )}
            </div>
            <div className="player-card__first">{player?.firstName.default}</div>
            <div className="player-card__last">
               {player ? player.lastName.default : team && 'Team'}
            </div>
         </div>
      </div>
   );
}

export default PlayerCard;
