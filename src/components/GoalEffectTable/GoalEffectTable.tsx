import '@components/GoalEffectTable/GoalEffectTable.css';
import type { PointerEvent } from 'react';
import { clsx } from 'clsx';
import { useGame } from '@context/useGame';
import { EVEN_STRENGTH_LABEL, GOAL_SITUATION_LABELS } from '@layout/constants';
import { NO_EVENTS } from '@layout/linkedEvents';
import { goalSituation } from '@engine/powerPlayCounter';
import { strengthLabel } from '@engine/strength';
import { periodLabel } from '@domain/labels';

type GoalEffectTableProps = {
   selectedIds?: ReadonlySet<number>;
   hoveredIds?: ReadonlySet<number>;
   onSelect?: (eventId: number) => void;
   onHover?: (eventId: number | undefined) => void;
};

function GoalEffectTable({
   selectedIds = NO_EVENTS,
   hoveredIds = NO_EVENTS,
   onSelect,
   onHover,
}: GoalEffectTableProps) {
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
               const time = play
                  ? `${periodLabel(play.periodDescriptor.number, game.regPeriods)} ${play.timeInPeriod}`
                  : '';
               const selected = selectedIds.has(goal.goalEventId);
               return (
                  <tr
                     key={goal.goalEventId}
                     className={clsx(
                        onSelect && 'goal-effect-table__row',
                        selected && 'goal-effect-table__row--selected',
                        !selected
                           && hoveredIds.has(goal.goalEventId)
                           && 'goal-effect-table__row--hovered',
                     )}
                     onClick={onSelect && (() => onSelect(goal.goalEventId))}
                     onPointerEnter={
                        onHover
                        && ((e: PointerEvent) => {
                           if (e.pointerType !== 'touch') onHover(goal.goalEventId);
                        })
                     }
                     onPointerLeave={onHover && (() => onHover(undefined))}
                  >
                     <td>
                        {onSelect ? (
                           <button
                              type="button"
                              className="goal-effect-table__pick"
                              aria-pressed={selected}
                              aria-label={`Select ${teamByHomeOrAway(goal.side).abbrev} goal at ${time}`}
                           >
                              {time}
                           </button>
                        ) : (
                           time
                        )}
                     </td>
                     <td>{teamByHomeOrAway(goal.side).abbrev}</td>
                     <td>{strengthLabel(goal.strength, goal.side)}</td>
                     <td>{situation ? GOAL_SITUATION_LABELS[situation] : EVEN_STRENGTH_LABEL}</td>
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
