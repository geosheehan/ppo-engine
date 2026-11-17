import type { GoalEffect } from '@engine/types';

export const NO_EVENTS: ReadonlySet<number> = new Set();

export function linkedEvents(
   goals: GoalEffect[],
   eventId: number | undefined,
): ReadonlySet<number> {
   if (eventId === undefined) return NO_EVENTS;
   const group = new Set([eventId]);
   for (const goal of goals) {
      const penalties = [goal.releasedPenaltyEventId, goal.washedPenaltyId];
      if (goal.goalEventId === eventId) {
         for (const penalty of penalties) if (penalty !== undefined) group.add(penalty);
      } else if (penalties.includes(eventId)) {
         group.add(goal.goalEventId);
      }
   }
   return group;
}
