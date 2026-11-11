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
import type { Side, Team } from '@domain/types';

type MergedTeam = {
   side: Side;
   team?: Team;
   color?: string;
   totals?: OpportunityTotal[];
};

type StrengthTableMergedProps = {
   teams: MergedTeam[];
   strength?: Strength;
};

const NO_TOTALS: OpportunityTotal[] = [];

// Both teams' power plays in one narrow table for phones, one row group per team in the order given.
function StrengthTableMerged({ teams, strength }: StrengthTableMergedProps) {
   return (
      <div className="strength-table__card strength-table__card--merged">
         <table className="strength-table strength-table--merged">
            <caption>POWER PLAYS</caption>
            <thead>
               <tr>
                  <th scope="col">
                     <span className="visually-hidden">Team</span>
                  </th>
                  <th scope="col">
                     <span className="visually-hidden">Stat</span>
                  </th>
                  {STRENGTHS.map((label) => (
                     <th key={label} scope="col">
                        {label}
                     </th>
                  ))}
                  <th scope="col">TOT</th>
               </tr>
            </thead>
            {teams.map(({ side, team, color, totals = NO_TOTALS }) => {
               const byLabel = new Map(totals.map((row) => [row.label, row]));
               const liveLabel = strength && strengthLabel(strength, side);
               const liveClass = (label: string): string | undefined =>
                  label === liveLabel ? 'strength-table__live' : undefined;
               const total = sumTotals(totals);
               return (
                  <tbody
                     key={side}
                     style={
                        color !== undefined
                           ? { '--team-color': color, '--team-text-color': textColorOn(color) }
                           : undefined
                     }
                  >
                     <tr>
                        <th scope="rowgroup" rowSpan={2} className="strength-table__team">
                           {team && <TeamChip teamId={team.id} />}
                        </th>
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
                        <th scope="row">Time</th>
                        {STRENGTHS.map((label) => {
                           const row = byLabel.get(label);
                           return (
                              <td
                                 key={label}
                                 className={clsx('strength-table__time', liveClass(label))}
                              >
                                 {row ? secondsToClock(row.seconds) : '0:00'}
                              </td>
                           );
                        })}
                        <td>{secondsToClock(total.seconds)}</td>
                     </tr>
                  </tbody>
               );
            })}
         </table>
      </div>
   );
}

export default StrengthTableMerged;
