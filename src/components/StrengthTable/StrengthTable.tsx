import type { OpportunityTotal } from '@engine/types';
import '@components/StrengthTable/StrengthTable.css';
import { clsx } from 'clsx';
import { record, STRENGTHS } from '@components/StrengthTable/rows';
import TeamChip from '@components/TeamChip';
import { strengthLabel } from '@engine/strength';
import { sumTotals } from '@engine/totals';
import type { Strength } from '@engine/types';
import { secondsToClock } from '@domain/clock';
import { textColorOn } from '@domain/colors';
import { SIDES } from '@domain/constants';
import type { Side, Team } from '@domain/types';

type StrengthTableProps = {
   side: Side;
   position: 'left' | 'right';
   team?: Team;
   color?: string;
   totals?: OpportunityTotal[];
   strength?: Strength;
};

const NO_TOTALS: OpportunityTotal[] = [];

function StrengthTable({
   side,
   position,
   team,
   color,
   totals = NO_TOTALS,
   strength,
}: StrengthTableProps) {
   const byLabel = new Map(totals.map((row) => [row.label, row]));
   // Only the power-play strengths have columns, so even strengths and 6v5 never light one up.
   const liveLabel = strength && strengthLabel(strength, side);
   const liveClass = (label: string): string | undefined =>
      label === liveLabel ? 'strength-table__live' : undefined;
   const total = sumTotals(totals);

   return (
      <div
         className={clsx(
            'strength-table__card',
            `strength-table__card--${position}`,
            side === SIDES.HOME && 'strength-table__card--home',
         )}
      >
         <table
            className="strength-table"
            style={
               color !== undefined
                  ? { '--team-color': color, '--team-text-color': textColorOn(color) }
                  : undefined
            }
         >
            <caption>{team && <TeamChip teamId={team.id} />} POWER PLAYS</caption>
            <thead>
               <tr>
                  <th scope="col">
                     <span className="visually-hidden">Stat</span>
                  </th>
                  {STRENGTHS.map((label) => (
                     <th key={label} scope="col" className={liveClass(label)}>
                        {label}
                     </th>
                  ))}
                  <th scope="col">TOT</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <th scope="row">G/Opp</th>
                  {STRENGTHS.map((label) => {
                     const row = byLabel.get(label);
                     return (
                        <td key={label} className={liveClass(label)}>
                           {row ? record(row.goals, row.opportunities) : '0/0'}
                        </td>
                     );
                  })}
                  <td>{record(total.goals, total.opportunities)}</td>
               </tr>
               <tr>
                  <th>Time</th>
                  {STRENGTHS.map((label) => {
                     const row = byLabel.get(label);
                     return (
                        <td key={label} className={clsx('strength-table__time', liveClass(label))}>
                           {row ? secondsToClock(row.seconds) : '0:00'}
                        </td>
                     );
                  })}
                  <td>{secondsToClock(total.seconds)}</td>
               </tr>
            </tbody>
         </table>
      </div>
   );
}

export default StrengthTable;
