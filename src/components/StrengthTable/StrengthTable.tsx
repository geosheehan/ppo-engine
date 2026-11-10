import type { OpportunityTotal } from '@engine/types';
import '@components/StrengthTable/StrengthTable.css';
import { clsx } from 'clsx';
import TeamChip from '@components/TeamChip';
import { strengthLabel } from '@engine/strength';
import type { Strength } from '@engine/types';
import { secondsToClock } from '@domain/clock';
import { textColorOn } from '@domain/colors';
import type { Side, Team } from '@domain/types';

type StrengthTableProps = {
   side: Side;
   position: 'left' | 'right';
   team?: Team;
   color?: string;
   totals?: OpportunityTotal[];
   strength?: Strength;
};

const STRENGTHS = ['5v4', '5v3', '4v3'] as const;
const NO_TOTALS: OpportunityTotal[] = [];

const record = (goals: number, opportunities: number): string => `${goals}/${opportunities}`;

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
   const total = totals.reduce(
      (sum, row) => ({
         goals: sum.goals + row.goals,
         opportunities: sum.opportunities + row.opportunities,
         seconds: sum.seconds + row.seconds,
      }),
      { goals: 0, opportunities: 0, seconds: 0 },
   );

   return (
      <div className={`strength-table__card strength-table__card--${position}`}>
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
