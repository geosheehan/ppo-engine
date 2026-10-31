import '@components/StrengthTable.css';
import { useGame } from '@context/GameContext.tsx';
import { secondsToClock } from '@domain/clock.ts';
import type { OpportunityTotal } from '@engine/opportunities.ts';
import type { Side } from '@engine/types.ts';

type StrengthTableProps = {
   side: Side;
   totals: OpportunityTotal[];
};

const STRENGTHS = ['5v4', '5v3', '4v3'] as const;

const record = (goals: number, opportunities: number): string => `${goals}/${opportunities}`;

function StrengthTable({ side, totals }: StrengthTableProps) {
   const { teamByHomeOrAway } = useGame();
   const byLabel = new Map(totals.map((row) => [row.label, row]));
   const total = totals.reduce(
      (sum, row) => ({
         goals: sum.goals + row.goals,
         opportunities: sum.opportunities + row.opportunities,
         seconds: sum.seconds + row.seconds
      }),
      { goals: 0, opportunities: 0, seconds: 0 }
   );


   return (
      <table className="strength-table">
         <caption>{teamByHomeOrAway(side).abbrev.toUpperCase()} POWER PLAYS</caption>
         <thead>
            <tr>
               <th />
               {STRENGTHS.map((label) => <th key={label} scope="col">{label}</th>)}
               <th>TOTALS</th>
            </tr>
         </thead>
         <tbody>
            <tr>
               <th scope="row">Goals/Occurrences</th>
               {
                  STRENGTHS.map((label) => {
                     const row = byLabel.get(label);
                     return <td key={label}>{row ? record(row.goals, row.opportunities) : '0/0'}</td>
                  })
               }
               <td>{record(total.goals, total.opportunities)}</td>
            </tr>
            <tr>
               <th>Time</th>
               {
                  STRENGTHS.map((label) => {
                     const row = byLabel.get(label);
                     return <td key={label}>{row ? secondsToClock(row.seconds) : '00:00'}</td>
                  })
               }
               <td>{secondsToClock(total.seconds)}</td>
            </tr>
         </tbody>
      </table>
   );
};

export default StrengthTable;
