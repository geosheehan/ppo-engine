import type { ClockedPenalty } from '@engine/types';
import '@components/PenaltyCard/PenaltyCard.css';
import PlayerCard from '@components/PlayerCard';
import { useGame } from '@context/useGame';
import { secondsToClock } from '@domain/clock';
import { penaltyDisplayName } from '@domain/penalties';

type PenaltyCardProps = {
   clocked: ClockedPenalty;
};

function PenaltyCard({ clocked }: PenaltyCardProps) {
   const { playerById, teamByHomeOrAway, teamColor } = useGame();
   const { details } = clocked.play;
   const playerId = details.committedByPlayerId ?? details.servedByPlayerId;
   const player = playerId !== undefined ? playerById(playerId) : undefined;
   const team = teamByHomeOrAway(clocked.served.side);
   const infraction = penaltyDisplayName(details.descKey);

   return (
      <div className="penalty-card">
         <div className="penalty-card__player">
            <PlayerCard player={player} team={team} color={teamColor(team.id)} />
            {player && <span className="penalty-card__name">{player.lastName.default}</span>}
         </div>
         <div className="penalty-card__penalty">
            <span className="penalty-card__time">{secondsToClock(clocked.remaining)}</span>
            <span className="penalty-card__infraction" title={infraction}>
               {infraction}
            </span>
         </div>
      </div>
   );
}

export default PenaltyCard;
