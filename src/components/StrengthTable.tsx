import '@components/StrengthTable.css';
import type { CSSProperties } from 'react';
import { useGame } from '@context/useGame.ts';
import { secondsToClock } from '@domain/clock.ts';
import { textColorOn } from '@domain/colors.ts';
import TeamChip from '@components/TeamChip.tsx';
import type { OpportunityTotal } from '@engine/opportunities.ts';
import type { Side, Strength } from '@engine/types.ts';

type StrengthTableProps = {
   side: Side;
   totals: OpportunityTotal[];
   strength: Strength;
   position: 'left' | 'right';
};

const STRENGTHS = ['5v4', '5v3', '4v3'] as const;

const record = (goals: number, opportunities: number): string => `${goals}/${opportunities}`;

function StrengthTable({ side, totals, strength, position }: StrengthTableProps) {
   const { teamByHomeOrAway, colors } = useGame();
   const byLabel = new Map(totals.map((row) => [row.label, row]));
   // Only the power-play strengths have columns, so even strengths and 6v5 never light one up.
   const liveLabel = `${strength[side]}v${strength[side === 'home' ? 'away' : 'home']}`;
   const liveClass = (label: string): string | undefined => (label === liveLabel ? 'strength-table__live' : undefined);
   const total = totals.reduce(
      (sum, row) => ({
         goals: sum.goals + row.goals,
         opportunities: sum.opportunities + row.opportunities,
         seconds: sum.seconds + row.seconds
      }),
      { goals: 0, opportunities: 0, seconds: 0 }
   );


   return (
      <div className={`strength-table__card strength-table__card--${position}`}>
         <table
            className="strength-table"
            style={{ '--team-color': colors[side], '--team-text-color': textColorOn(colors[side]) } as CSSProperties}
         >
            <caption>
               <TeamChip teamId={teamByHomeOrAway(side).id} /> POWER PLAYS
            </caption>
            <thead>
               <tr>
                  <th />
                  {STRENGTHS.map((label) => <th key={label} scope="col" className={liveClass(label)}>{label}</th>)}
                  <th>TOT</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <th scope="row">G/Opp</th>
                  {
                     STRENGTHS.map((label) => {
                        const row = byLabel.get(label);
                        return <td key={label} className={liveClass(label)}>{row ? record(row.goals, row.opportunities) : '0/0'}</td>
                     })
                  }
                  <td>{record(total.goals, total.opportunities)}</td>
               </tr>
               <tr>
                  <th>Time</th>
                  {
                     STRENGTHS.map((label) => {
                        const row = byLabel.get(label);
                        return (
                           <td key={label} className={`strength-table__time ${liveClass(label) ?? ''}`}>
                              {row ? secondsToClock(row.seconds) : '0:00'}
                           </td>
                        );
                     })
                  }
                  <td>{secondsToClock(total.seconds)}</td>
               </tr>
            </tbody>
         </table>
      </div>
   );
};

export default StrengthTable;
