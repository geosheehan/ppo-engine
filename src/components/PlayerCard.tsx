import '@components/PlayerCard.css';
import placeholderHeadshot from '@assets/placeholder-headshot.png';
import type { Player, Team } from '@domain/types.ts';

type PlayerCardProps = {
   player?: Player;
   team: Team;
   color: string;
};

function PlayerCard({ player, team, color }: PlayerCardProps) {
   return (
      <div className="player-card">
         <img className="player-card__headshot" src={placeholderHeadshot} alt="" style={{ background: color }} />
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
