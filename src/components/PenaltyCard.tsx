import '@components/PenaltyCard.css';
import { useGame } from '@context/useGame';
import { secondsToClock } from '@domain/clock';
import { penaltyDisplayName } from '@domain/penalties';
import type { ClockedPenalty } from '@engine/snapshot';
import PlayerCard from '@components/PlayerCard';

type PenaltyCardProps = {
   clocked: ClockedPenalty;
};

function PenaltyCard({ clocked }: PenaltyCardProps) {
   const { playerById, teamByHomeOrAway } = useGame();
   const { details } = clocked.play;
   const playerId = details.committedByPlayerId ?? details.servedByPlayerId;
   const infraction = penaltyDisplayName(details.descKey);

   return (
      <div className="penalty-card">
         <PlayerCard player={playerId ? playerById(playerId) : undefined} team={teamByHomeOrAway(clocked.served.side)} />
         <div className="penalty-card__penalty">
            <span className="penalty-card__time">{secondsToClock(clocked.remaining)}</span>
            <span className="penalty-card__infraction" title={infraction}>{infraction}</span>
         </div>
      </div>
   );
};

export default PenaltyCard;
