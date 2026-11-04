import '@components/PlayerCard/PlayerCard.css';
import { clsx } from 'clsx';
import placeholderHeadshot from '@assets/placeholder-headshot.png';
import type { Player, Team } from '@domain/types';

type PlayerCardProps = {
   player?: Player;
   team?: Team;
   color?: string;
   mirrored?: boolean;
};

function PlayerCard({ player, team, color, mirrored = false }: PlayerCardProps) {
   return (
      <div className={clsx('player-card', mirrored && 'player-card--mirrored')}>
         <img
            className="player-card__headshot"
            src={placeholderHeadshot}
            alt=""
            style={color !== undefined ? { background: color } : undefined}
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
