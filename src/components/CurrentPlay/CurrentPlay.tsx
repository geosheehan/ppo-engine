import type { ParticipantCard, ParticipantLayout } from '@layout/types';
import type { GoalSituation } from '@engine/types';
import { LINE_CHANGE } from '@domain/constants';
import { isGoal, isPenalty, isStoppage } from '@domain/plays';
import '@components/CurrentPlay/CurrentPlay.css';
import TeamChip from '@components/TeamChip';
import { participantRoles, rolesLine } from '@layout/participantRoles';
import { goalSituation } from '@engine/powerPlayCounter';
import type { GoalEffect } from '@engine/types';
import { penaltyDisplayName } from '@domain/penalties';
import { playerShortName } from '@domain/players';
import { stepTypeLabel } from '@domain/steps';
import { stoppageDetail } from '@domain/stoppages';
import type { Play, Player, Side } from '@domain/types';

type CurrentPlayProps = {
   play?: Play;
   player?: Player;
   goalEffect?: GoalEffect;
   changedTeamId?: number;
   participants?: ParticipantLayout<ParticipantCard>;
   abbrevs?: Record<Side, string>;
};

const SITUATION_LABELS: Record<GoalSituation, string> = {
   'power-play': 'Power Play',
   'shorthanded': 'Short Handed',
};

function CurrentPlay({
   play,
   player,
   goalEffect,
   changedTeamId,
   participants,
   abbrevs,
}: CurrentPlayProps) {
   const roles = (
      <div className="current-play__roles">
         {participants && (
            <>
               <span className="current-play__roles-full">
                  {rolesLine(participantRoles(participants))}
               </span>
               <span className="current-play__roles-short">
                  {rolesLine(participantRoles(participants, { combineAssists: true }))}
               </span>
            </>
         )}
      </div>
   );

   if (changedTeamId !== undefined) {
      return (
         <div className="current-play">
            <div className="current-play__what">
               <TeamChip teamId={changedTeamId} />
               {stepTypeLabel(LINE_CHANGE)}
            </div>
            <div className="current-play__detail" />
            {roles}
         </div>
      );
   }

   if (!play) {
      return (
         <div className="current-play">
            <div className="current-play__what" />
            <div className="current-play__detail" />
            {roles}
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
   } else if (isStoppage(play)) {
      detail = stoppageDetail(play.details, abbrevs);
   }

   return (
      <div className="current-play">
         <div className="current-play__what">
            {teamId !== undefined && <TeamChip teamId={teamId} />}
            {situation && `${SITUATION_LABELS[situation]} `}
            {stepTypeLabel(play.typeDescKey)}
         </div>
         <div className="current-play__detail">{detail}</div>
         {roles}
      </div>
   );
}

export default CurrentPlay;
