import type { GameElapsed, Side } from '@domain/types';
import { otherSide } from '@domain/types';
import { lastIndexWhere } from '@domain/search';
import { isSameStrength, strengthLabel } from '@engine/strength';
import type { GoalEffect, Strength, TimelineEntry } from '@engine/types';

export type Opportunity = {
   side: Side;
   strength: Strength;
   time: GameElapsed;
};

export type OpportunityTotal = {
   label: string;
   opportunities: number;
   goals: number;
   seconds: number;
};

export type PowerPlayTotals = Record<Side, OpportunityTotal[]>;

export type Checkpoint = {
   time: GameElapsed;
   strength: Strength;
   strengthStart: GameElapsed;
   totals: PowerPlayTotals;
};

export type PowerPlayCount = {
   opportunities: Opportunity[];
   checkpoints: Checkpoint[];
};

const advantagedSide = (strength: Strength): Side | null => {
   if (strength.away === strength.home) return null;
   return strength.away > strength.home ? 'away' : 'home';
};

const advantageOf = (strength: Strength, side: Side): number =>
   Math.max(0, strength[side] - strength[otherSide(side)]);

export type GoalSituation = 'power-play' | 'shorthanded';

export function goalSituation(goal: GoalEffect): GoalSituation | null {
   const advantaged = advantagedSide(goal.strength);
   if (goal.penaltyShot || !advantaged) return null;
   return advantaged === goal.side ? 'power-play' : 'shorthanded';
}

// Every power-play opportunity, goal and second of power-play time, following the NHL's official counting, in one
// pass over the engine's timeline. A team is awarded a new opportunity when:
// 1. it gains an advantage, or its advantage grows (5v5 -> 5v4, 4v4 -> 5v4, 5v4 -> 5v3).
//    An advantage that shrinks or changes shape (5v3 -> 5v4, 4v3 -> 5v4) is not a new one;
// 2. it scores a power-play goal and the strength doesn't change (majors give n/n+1);
// 3. a different penalty starts on one of the short-handed team's penalty clocks while the strength doesn't change
//    (provisional: a queued penalty starting during a 5v3; confirmed: a minor following the same player's major);
// 4. the second half of the other team's double minor starts. Each half of a double minor is its own opportunity,
//    typed by the strength when that half starts, so a double minor is 0/2.
//    A goal in the first half starts the second half early; it isn't a third opportunity.
// Short-handed and penalty-shot goals neither start nor end an opportunity.
export function countPowerPlays(timeline: TimelineEntry[]): PowerPlayCount {
   const counter = new PowerPlayCounter();
   let second: TimelineEntry[] = [];
   for (const entry of timeline) {
      if (second.length > 0 && second[0].time !== entry.time) {
         counter.step(second);
         second = [];
      }
      second.push(entry);
   }
   if (second.length > 0) counter.step(second);
   return { opportunities: counter.opportunities, checkpoints: counter.checkpoints };
}

// Opportunities, power-play goals and power-play time per team and strength, up to `time`.
export function totalsAt({ checkpoints }: PowerPlayCount, time: GameElapsed = Infinity): PowerPlayTotals {
   const checkpoint = checkpoints[lastIndexWhere(checkpoints, (checkpoint) => checkpoint.time <= time)];
   if (!checkpoint) return { away: [], home: [] };

   const side = advantagedSide(checkpoint.strength);
   const seconds = time - checkpoint.strengthStart;
   if (!side || seconds === 0) return checkpoint.totals;

   const label = strengthLabel(checkpoint.strength, side);
   const totals = checkpoint.totals[side];
   const running = totals.some((total) => total.label === label)
      ? totals.map((total) => (total.label === label ? { ...total, seconds: total.seconds + seconds } : total))
      : [...totals, { label, opportunities: 0, goals: 0, seconds }];
   return { ...checkpoint.totals, [side]: running };
}

class PowerPlayCounter {
   readonly opportunities: Opportunity[] = [];
   readonly checkpoints: Checkpoint[] = [];
   private readonly totals: Record<Side, Map<string, OpportunityTotal>> = { away: new Map(), home: new Map() };
   private strength: Strength = { away: 5, home: 5 };
   private strengthStart: GameElapsed = 0;

   // One second of the timeline: the strength before it, what happened in it, and the strength after it.
   step(entries: TimelineEntry[]): void {
      const time = entries[0].time;
      const before = this.strength;
      let after = before;
      const powerPlayGoals: GoalEffect[] = [];
      const handoffs: Side[] = [];
      const secondHalves: Side[] = [];

      for (const entry of entries) {
         if (entry.kind === 'strength') {
            after = entry.strength;
         } else if (entry.kind === 'goal' && goalSituation(entry.goal) === 'power-play') {
            this.totalFor(entry.goal.side, entry.goal.strength).goals += 1;
            powerPlayGoals.push(entry.goal);
         } else if (entry.kind === 'penaltyStart') {
            const { penalty, reason } = entry;
            if (penalty.doubleMinorHalf === 2) {
               if (!penalty.coincidental) secondHalves.push(penalty.side);
            } else if (reason !== 'called') {
               handoffs.push(penalty.side);
            }
         }
      }

      if (!isSameStrength(before, after)) {
         this.addPowerPlayTime(time);
         this.strength = after;
         this.strengthStart = time;
      }

      const side = advantagedSide(after);
      if (side) {
         const shortHanded = otherSide(side);
         const unchanged = isSameStrength(before, after);
         const awarded = advantageOf(after, side) > advantageOf(before, side)
            || secondHalves.includes(shortHanded)
            || (unchanged && handoffs.includes(shortHanded))
            || (unchanged && powerPlayGoals.some((goal) => goal.side === side && isSameStrength(goal.strength, after)));
         if (awarded) {
            this.opportunities.push({ side, strength: after, time });
            this.totalFor(side, after).opportunities += 1;
         }
      }

      this.checkpoints.push({ time, strength: after, strengthStart: this.strengthStart, totals: this.copyTotals() });
   }

   private addPowerPlayTime(time: GameElapsed): void {
      const side = advantagedSide(this.strength);
      if (side) this.totalFor(side, this.strength).seconds += time - this.strengthStart;
   }

   private totalFor(side: Side, strength: Strength): OpportunityTotal {
      const label = strengthLabel(strength, side);
      let total = this.totals[side].get(label);
      if (!total) {
         total = { label, opportunities: 0, goals: 0, seconds: 0 };
         this.totals[side].set(label, total);
      }
      return total;
   }

   private copyTotals(): PowerPlayTotals {
      return {
         away: [...this.totals.away.values()].map((total) => ({ ...total })),
         home: [...this.totals.home.values()].map((total) => ({ ...total })),
      };
   }
}
