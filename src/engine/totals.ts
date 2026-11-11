import type { OpportunityTotal } from '@engine/types';

export type TotalSum = Pick<OpportunityTotal, 'goals' | 'opportunities' | 'seconds'>;

export const sumTotals = (rows: OpportunityTotal[]): TotalSum =>
   rows.reduce(
      (sum, row) => ({
         goals: sum.goals + row.goals,
         opportunities: sum.opportunities + row.opportunities,
         seconds: sum.seconds + row.seconds,
      }),
      { goals: 0, opportunities: 0, seconds: 0 },
   );
