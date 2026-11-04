import type { GoalSituation } from '@engine/types';
import { LINE_CHANGE } from '@domain/constants';
import { isGoal, isPenalty } from '@domain/plays';
import '@components/CurrentPlay/CurrentPlay.css';
import TeamChip from '@components/TeamChip';
import { goalSituation } from '@engine/powerPlayCounter';
import type { GoalEffect } from '@engine/types';
import { penaltyDisplayName } from '@domain/penalties';
import { playerShortName } from '@domain/players';
import { stepTypeLabel } from '@domain/steps';
import type { Play, Player } from '@domain/types';

type CurrentPlayProps = {
   play?: Play;
   player?: Player;
   goalEffect?: GoalEffect;
   changedTeamId?: number;
};

const SITUATION_LABELS: Record<GoalSituation, string> = {
   'power-play': 'Power Play',
   'shorthanded': 'Short Handed',
};

function CurrentPlay({ play, player, goalEffect, changedTeamId }: CurrentPlayProps) {
   if (changedTeamId !== undefined) {
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

   if (!play) {
      return (
         <div className="current-play">
            <div className="current-play__what" />
            <div className="current-play__detail" />
         </div>
      );
   }

   const teamId = play.details?.eventOwnerTeamId;
   const situation = goalEffect ? goalSituation(goalEffect) : null;

   let detail: string | undefined;
   if (isPenalty(play)) {
      detail = `${penaltyDisplayName(play.details.descKey)} | ${play.details.duration} min | ${playerShortName(player)}`;
   } else if (isGoal(play)) {
      detail = playerShortName(player);
   }

   return (
      <div className="current-play">
         <div className="current-play__what">
            {teamId !== undefined && <TeamChip teamId={teamId} />}
            {situation && `${SITUATION_LABELS[situation]} `}
            {stepTypeLabel(play.typeDescKey)}
         </div>
         <div className="current-play__detail">{detail}</div>
      </div>
   );
}

export default CurrentPlay;
