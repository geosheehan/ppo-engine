import type { Sentence } from '@engine/assessment';
import type { GameElapsed, Side } from '@domain/types';
import type { PenaltyClock, PenaltyEndReason, ServedPenalty } from '@engine/types';

type Serving = {
   sentence: Sentence;
   penaltyIndex: number;
   penaltyStart: GameElapsed;
   expiresAt: GameElapsed;
};


export class PenaltyBox {
   private readonly penaltyClocks: [Serving | null, Serving | null] = [null, null];
   private readonly queue: Sentence[] = [];
   readonly side: Side;

   constructor(side: Side) {
      this.side = side;
   }

   get runningClockCount(): number {
      return this.penaltyClocks.filter((serving) => serving !== null).length;
   }

   get isEmpty(): boolean {
      return this.runningClockCount === 0 && this.queue.length === 0;
   }

   // Moves the front of the queue onto each free penalty clock, left clock first.
   private fillFreePenaltyClocks(time: GameElapsed): void {
      for (const penaltyClock of [0, 1] as const) {
         if (this.penaltyClocks[penaltyClock] === null && this.queue.length > 0) {
            this.penaltyClocks[penaltyClock] = startPenalty(this.queue.shift()!, 0, time);
         }
      }
   }

   nextExpiry(): GameElapsed | undefined {
      const times = this.penaltyClocks.flatMap((serving) => (serving ? [serving.expiresAt] : []));
      return times.length > 0 ? Math.min(...times) : undefined;
   }

   add(sentence: Sentence, time: GameElapsed): void {
      this.queue.push(sentence);
      this.fillFreePenaltyClocks(time);
   }

   expireAt(time: GameElapsed, reason: PenaltyEndReason = 'expired'): ServedPenalty[] {
      const closed: ServedPenalty[] = [];
      for (const penaltyClock of [0, 1] as const) {
         if (this.penaltyClocks[penaltyClock]?.expiresAt === time) closed.push(this.endPenalty(penaltyClock, time, reason));
      }
      this.fillFreePenaltyClocks(time);
      return closed;
   }

   releaseOnGoal(time: GameElapsed, goalEventId: number): ServedPenalty | undefined {
      let chosen: PenaltyClock | undefined;
      for (const penaltyClock of [0, 1] as const) {
         const serving = this.penaltyClocks[penaltyClock];
         if (!serving || serving.sentence.coincidental || currentPenalty(serving).kind !== 'minor') continue;
         if (chosen === undefined || timeOnClock(serving, time) < timeOnClock(this.penaltyClocks[chosen]!, time)) chosen = penaltyClock;
      }
      if (chosen === undefined) return undefined;

      const released = this.endPenalty(chosen, time, 'goal', goalEventId);
      this.fillFreePenaltyClocks(time);
      return released;
   }

   closeAll(time: GameElapsed, reason: PenaltyEndReason): ServedPenalty[] {
      const closed: ServedPenalty[] = [];
      for (const penaltyClock of [0, 1] as const) {
         const serving = this.penaltyClocks[penaltyClock];
         if (serving) closed.push(toServedPenalty(serving, this.side, penaltyClock, time, reason));
         this.penaltyClocks[penaltyClock] = null;
      }
      this.queue.length = 0;
      return closed;
   }

   private endPenalty(penaltyClock: PenaltyClock, time: GameElapsed, reason: PenaltyEndReason, goalEventId?: number): ServedPenalty {
      const serving = this.penaltyClocks[penaltyClock]!;
      const served = toServedPenalty(serving, this.side, penaltyClock, time, reason, goalEventId);
      const nextIndex = serving.penaltyIndex + 1;
      this.penaltyClocks[penaltyClock] = nextIndex < serving.sentence.penalties.length
         ? startPenalty(serving.sentence, nextIndex, time)
         : null;
      return served;
   }
}

const currentPenalty = (serving: Serving) => serving.sentence.penalties[serving.penaltyIndex];

function timeOnClock(serving: Serving, time: GameElapsed): number {
   const later = serving.sentence.penalties.slice(serving.penaltyIndex + 1).reduce((sum, penalty) => sum + penalty.seconds, 0);
   return serving.expiresAt - time + later;
}

function startPenalty(sentence: Sentence, penaltyIndex: number, time: GameElapsed): Serving {
   return { sentence, penaltyIndex, penaltyStart: time, expiresAt: time + sentence.penalties[penaltyIndex].seconds };
}

function toServedPenalty(serving: Serving, side: Side, penaltyClock: PenaltyClock, end: GameElapsed, endReason: PenaltyEndReason, releasedByGoalId?: number): ServedPenalty {
   const penalty = currentPenalty(serving);
   return {
      penaltyEventId: penalty.eventId,
      side,
      penaltyClock,
      kind: penalty.kind,
      ...(penalty.doubleMinorHalf ? { doubleMinorHalf: penalty.doubleMinorHalf } : {}),
      start: serving.penaltyStart,
      end,
      endReason,
      ...(releasedByGoalId !== undefined ? { releasedByGoalId } : {}),
      coincidental: serving.sentence.coincidental,
   };
}
