import '@components/PlayerCard.css';
import { clsx } from 'clsx';
import placeholderHeadshot from '@assets/placeholder-headshot.png';
import { useGame } from '@context/useGame';
import type { Player, Team } from '@domain/types';

type PlayerCardProps = {
   player?: Player;
   team: Team;
   mirrored?: boolean;
};

function PlayerCard({ player, team, mirrored = false }: PlayerCardProps) {
   const { teamColor } = useGame();

   return (
      <div className={clsx('player-card', mirrored && 'player-card--mirrored')}>
         <img className="player-card__headshot" src={placeholderHeadshot} alt="" style={{ background: teamColor(team.id) }} />
         <div className="player-card__info">
            <div className="player-card__meta">
               {team.abbrev}
               {player && <> #{player.sweaterNumber} · {player.positionCode}</>}
            </div>
            <div className="player-card__first">{player?.firstName.default}</div>
            <div className="player-card__last">{player ? player.lastName.default : 'Team'}</div>
         </div>
      </div>
   );
};

export default PlayerCard;
