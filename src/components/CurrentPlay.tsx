import '@components/CurrentPlay.css';
import { useGame } from '@context/useGame.ts';
import TeamChip from '@components/TeamChip.tsx';
import { isGoal, isPenalty } from '@domain/types.ts';
import type { Play } from '@domain/types.ts';
import { penaltyDisplayName } from '@domain/penalties.ts';
import { playerShortName } from '@domain/players.ts';
import { LINE_CHANGE, stepTypeLabel } from '@domain/steps.ts';
import { goalSituation } from '@engine/powerPlayCounter.ts';
import type { GoalSituation } from '@engine/powerPlayCounter.ts';
import type { GoalEffect } from '@engine/types.ts';

type CurrentPlayProps = {
   play: Play;
   goalEffect?: GoalEffect;
   changedTeamId?: number;
};

const SITUATION_LABELS: Record<GoalSituation, string> = {
   'power-play': 'Power Play',
   'shorthanded': 'Short Handed',
};

function CurrentPlay({ play, goalEffect, changedTeamId }: CurrentPlayProps) {
   const { playerById } = useGame();

   if (changedTeamId) {
      return (
         <div className="current-play">
            <div className="current-play__what">
               <TeamChip teamId={changedTeamId} />
               {stepTypeLabel(LINE_CHANGE)}
            </div>
            <div className="current-play__detail" />
         </div>
      );
   }

   const teamId = play.details?.eventOwnerTeamId;
   const situation = goalEffect ? goalSituation(goalEffect) : null;

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
         <div className="current-play__what">
            {teamId && <TeamChip teamId={teamId} />}
            {situation && `${SITUATION_LABELS[situation]} `}
            {stepTypeLabel(play.typeDescKey)}
         </div>
         <div className="current-play__detail">{detail}</div>
      </div>
   );
};

export default CurrentPlay;
