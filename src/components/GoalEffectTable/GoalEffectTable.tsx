import '@components/GoalEffectTable/GoalEffectTable.css';
import { useGame } from '@context/useGame';
import { goalSituation } from '@engine/powerPlayCounter';
import { strengthLabel } from '@engine/strength';
import type { GoalSituation } from '@engine/types';
import { periodLabel } from '@domain/labels';

const SITUATION_LABELS: Record<GoalSituation, string> = {
   'power-play': 'PP',
   'shorthanded': 'SH',
};

function GoalEffectTable() {
   const { game, plays, penalties, penaltyResult, playerById, teamByHomeOrAway } = useGame();
   const playById = new Map(plays.map((play) => [play.eventId, play]));

   const penaltyLabel = (eventId: number | undefined): string => {
      if (eventId === undefined) return '';
      const penalty = penalties.find((play) => play.eventId === eventId);
      const playerId = penalty?.details.committedByPlayerId ?? penalty?.details.servedByPlayerId;
      const player = playerId !== undefined ? playerById(playerId) : undefined;
      return player ? `#${player.sweaterNumber}` : String(eventId);
   };

   if (penaltyResult.goals.length === 0) return null;

   return (
      <table className="goal-effect-table">
         <caption>Goals</caption>
         <thead>
            <tr>
               <th>Time</th>
               <th>Team</th>
               <th>Strength</th>
               <th>Situation</th>
               <th>Released</th>
               <th>Washed</th>
            </tr>
         </thead>
         <tbody>
            {penaltyResult.goals.map((goal) => {
               const play = playById.get(goal.goalEventId);
               const situation = goalSituation(goal);
               return (
                  <tr key={goal.goalEventId}>
                     <td>
                        {play
                           && `${periodLabel(play.periodDescriptor.number, game.regPeriods)} ${play.timeInPeriod}`}
                     </td>
                     <td>{teamByHomeOrAway(goal.side).abbrev}</td>
                     <td>{strengthLabel(goal.strength, goal.side)}</td>
                     <td>{situation ? SITUATION_LABELS[situation] : 'EV'}</td>
                     <td>{penaltyLabel(goal.releasedPenaltyEventId)}</td>
                     <td>{penaltyLabel(goal.washedPenaltyId)}</td>
                  </tr>
               );
            })}
         </tbody>
      </table>
   );
}

export default GoalEffectTable;
