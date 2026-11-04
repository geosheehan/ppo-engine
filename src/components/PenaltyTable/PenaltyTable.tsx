import { useGame } from '@context/useGame';
import { penaltyDisplayName } from '@domain/penalties';
import type { Player } from '@domain/types';

function PenaltyTable({ team }: { team: 'home' | 'away' }) {
   const { penalties, teamById, playerById, teamByHomeOrAway } = useGame();

   const penaltyTeam = teamByHomeOrAway(team);
   const teamPenalties = penalties.filter((penalty) => {
      const team = teamById(penalty.details.eventOwnerTeamId);
      return team === penaltyTeam;
   });

   const playerDisplayName = (player: Player | undefined): string => {
      if (player) {
         return `${player.sweaterNumber} ${player.firstName.default[0]}.${player.lastName.default.toUpperCase()}`;
      }
      return 'UNK Unknown Player';
   };

   const tableCaption =
      `${penaltyTeam.placeName.default} ${penaltyTeam.commonName.default}`.toUpperCase();

   return (
      <table>
         <caption>{tableCaption}</caption>
         <thead>
            <tr>
               <th>Per</th>
               <th>Time</th>
               <th>Team</th>
               <th>Player</th>
               <th>PIM</th>
               <th>Penalty</th>
            </tr>
         </thead>
         <tbody>
            {teamPenalties.map((penalty) => {
               const details = penalty.details;
               const team = teamById(details.eventOwnerTeamId);
               const player =
                  details.committedByPlayerId !== undefined
                     ? playerById(details.committedByPlayerId)
                     : undefined;
               return (
                  <tr key={penalty.eventId}>
                     <td>{penalty.periodDescriptor.number}</td>
                     <td>{penalty.timeInPeriod}</td>
                     <td>{team?.abbrev ?? 'UNK'}</td>
                     <td>{playerDisplayName(player)}</td>
                     <td>{details.duration}</td>
                     <td>{penaltyDisplayName(details.descKey)}</td>
                  </tr>
               );
            })}
         </tbody>
      </table>
   );
}

export default PenaltyTable;
