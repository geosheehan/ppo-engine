import '@components/CurrentPlay.css';
import { useGame } from '@context/GameContext.tsx';
import { isGoal, isPenalty } from '@domain/types.ts';
import type { Play } from '@domain/types.ts';
import { penaltyDisplayName } from '@domain/penalties.ts';
import { playerShortName } from '@domain/players.ts';
import type { GoalEffect } from '@engine/types.ts';

type CurrentPlayProps = {
   play: Play;
   goalEffect?: GoalEffect;
};

const periodLabel = (play: Play): string =>
   play.periodDescriptor.periodType === 'REG' ? `P${play.periodDescriptor.number}` : play.periodDescriptor.periodType;

const playTypeLabel = (typeDescKey: string): string => {
   const words = typeDescKey.replaceAll('-', ' ');
   return words.charAt(0).toUpperCase() + words.slice(1);
};

const ownerTeamId = (play: Play): number | undefined =>
   (play.details as { eventOwnerTeamId?: number } | undefined)?.eventOwnerTeamId;

function CurrentPlay({ play }: CurrentPlayProps) {
   const { teamById, playerById } = useGame();
   const teamId = ownerTeamId(play);
   const team = teamId ? teamById(teamId) : undefined;

   let detail: string | undefined;
   if (isPenalty(play)) {
      const playerId = play.details.committedByPlayerId ?? play.details.servedByPlayerId;
      const player = playerId ? playerById(playerId) : undefined;
      detail = `${penaltyDisplayName(play.details.descKey)} | ${play.details.duration} min | ${playerShortName(player)}`;
   } else if (isGoal(play)) {
      detail = playerShortName(playerById(play.details.scoringPlayerId));
   }

   return (
      <div className="current-play">
         <div className="current-play__when">{periodLabel(play)} {play.timeInPeriod}</div>
         <div className="current-play__what">
            {team && <span className="current-play__team">{team.abbrev}</span>}
            {playTypeLabel(play.typeDescKey)}
         </div>
         <div className="current-play__detail">{detail}</div>
      </div>
   );
};

export default CurrentPlay;
