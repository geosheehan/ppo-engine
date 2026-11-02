import type { GoalPlay } from '@domain/types';
import { playTime } from '@engine/penaltyEngine';
import { isSameStrength } from '@engine/strength';
import type { GoalEffect, PenaltyEngineResult, Side, Strength } from '@engine/types';

export type Opportunity = {
   side: Side;
   strength: Strength;
   time: number;
};

export type OpportunityTotal = {
   label: string;
   opportunities: number;
   goals: number;
   seconds: number;
};

const otherSide = (side: Side): Side => (side === 'away' ? 'home' : 'away');

const advantagedSide = (strength: Strength): Side | null => {
   if (strength.away === strength.home) return null;
   return strength.away > strength.home ? 'away' : 'home';
};

const advantageOf = (strength: Strength, side: Side): number =>
   Math.max(0, strength[side] - strength[otherSide(side)]);

const strengthLabel = (strength: Strength, side: Side): string =>
   `${strength[side]}v${strength[otherSide(side)]}`;

export type GoalSituation = 'power-play' | 'shorthanded';

export function goalSituation(goal: GoalEffect): GoalSituation | null {
   const advantaged = advantagedSide(goal.strength);
   if (goal.penaltyShot || !advantaged) return null;
   return advantaged === goal.side ? 'power-play' : 'shorthanded';
}

const isPowerPlayGoal = (goal: GoalEffect): boolean => goalSituation(goal) === 'power-play';

function powerPlayGoalTimes(result: PenaltyEngineResult, goalPlays: Map<number, GoalPlay>) {
   const times = [];
   for (const goal of result.goals) {
      if (!isPowerPlayGoal(goal)) continue;
      const play = goalPlays.get(goal.goalEventId);
      if (play) times.push({ goal, time: playTime(play) });
   }
   return times;
}

// Times a different penalty took over a penalty clock in the same second another one ended:
// a queued penalty starting, or a player's minor following their major. The second half of a
// double minor has the same penaltyEventId, so it isn't a takeover.
function takeoverTimes(result: PenaltyEngineResult): number[] {
   return result.servedPenalties
      .filter((next) => result.servedPenalties.some((previous) => previous.side === next.side
         && previous.penaltyClock === next.penaltyClock
         && previous.end === next.start
         && previous.penaltyEventId !== next.penaltyEventId))
      .map((next) => next.start);
}

// Times the second half of a double minor started running, by the side serving it.
function secondHalfStarts(result: PenaltyEngineResult): { side: Side; time: number }[] {
   return result.servedPenalties
      .filter((penalty) => penalty.doubleMinorHalf === 2 && !penalty.coincidental)
      .map((penalty) => ({ side: penalty.side, time: penalty.start }));
}

// Every power-play opportunity awarded up to `time`, following the NHL's official counting.
// A team is awarded a new opportunity when:
// 1. it gains an advantage, or its advantage grows (5v5 -> 5v4, 4v4 -> 5v4, 5v4 -> 5v3).
//    An advantage that shrinks or changes shape (5v3 -> 5v4, 4v3 -> 5v4) is not a new one;
// 2. it scores a power-play goal and the strength doesn't change (majors give n/n+1);
// 3. a different penalty takes over a penalty clock while the strength doesn't change
//    (provisional: a queued penalty starting during a 5v3, or a minor following a major);
// 4. the second half of the other team's double minor starts. Each half of a double minor is its
//    own opportunity, typed by the strength when that half starts, so a double minor is 0/2.
//    A goal in the first half starts the second half early; it isn't a third opportunity.
// Short-handed and penalty-shot goals neither start nor end an opportunity.
export function powerPlayOpportunities(result: PenaltyEngineResult, goalPlays: Map<number, GoalPlay>, time = Infinity): Opportunity[] {
   const goals = powerPlayGoalTimes(result, goalPlays);
   const takeovers = takeoverTimes(result);
   const secondHalves = secondHalfStarts(result);

   const opportunities: Opportunity[] = [];
   let previous: Strength = { away: 5, home: 5 };
   for (const interval of result.strengthIntervals) {
      if (interval.start > time) break;
      const strength = { away: interval.away, home: interval.home };
      const side = advantagedSide(strength);

      if (side) {
         // Rule 1
         const grew = advantageOf(strength, side) > advantageOf(previous, side);
         if (grew) {
            opportunities.push({ side, strength, time: interval.start });
         }

         // Rules 2 and 3 only apply inside the interval, where the strength doesn't change.
         const inside = (at: number) => interval.start < at && at < interval.end && at <= time;
         const goalSplits = goals
            .filter((scored) => scored.goal.side === side && isSameStrength(scored.goal.strength, strength))
            .map((scored) => scored.time);
         // Rule 4 also applies at the start of the interval, when the second half starts as the
         // strength shrinks (5v3 -> 5v4), unless rule 1 already awarded one there.
         const secondHalfSplits = secondHalves
            .filter((half) => half.side === otherSide(side))
            .map((half) => half.time)
            .filter((at) => inside(at) || (at === interval.start && !grew));
         const splits = new Set([...[...goalSplits, ...takeovers].filter(inside), ...secondHalfSplits]);
         for (const at of [...splits].toSorted((a, b) => a - b)) {
            opportunities.push({ side, strength, time: at });
         }
      }
      previous = strength;
   }
   return opportunities;
}

// Opportunities, power-play goals and power-play time per team and strength, up to `time`.
// Goals and time are counted by the strength they happened at, separately from the opportunities.
export function opportunityTotals(result: PenaltyEngineResult, goalPlays: Map<number, GoalPlay>, time = Infinity): Record<Side, OpportunityTotal[]> {
   const totals: Record<Side, Map<string, OpportunityTotal>> = { away: new Map(), home: new Map() };
   const totalFor = (side: Side, strength: Strength): OpportunityTotal => {
      const label = strengthLabel(strength, side);
      const total = totals[side].get(label) ?? { label, opportunities: 0, goals: 0, seconds: 0 };
      totals[side].set(label, total);
      return total;
   };

   for (const opportunity of powerPlayOpportunities(result, goalPlays, time)) {
      totalFor(opportunity.side, opportunity.strength).opportunities += 1;
   }
   for (const scored of powerPlayGoalTimes(result, goalPlays)) {
      if (scored.time <= time) totalFor(scored.goal.side, scored.goal.strength).goals += 1;
   }
   for (const interval of result.strengthIntervals) {
      const side = advantagedSide(interval);
      if (side && interval.start < time) {
         totalFor(side, interval).seconds += Math.min(interval.end, time) - interval.start;
      }
   }
   return { away: [...totals.away.values()], home: [...totals.home.values()] };
}
