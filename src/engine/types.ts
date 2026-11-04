import type { GameElapsed, Side } from '@domain/types';

export type PenaltyClock = 0 | 1;

export type Strength = Record<Side, number>;

export type PenaltyKind = 'minor' | 'major';

export type PenaltyEndReason = 'expired' | 'goal' | 'gameEnd' | 'projected';

export type PenaltyStartReason = 'called' | 'dequeued' | 'nextInSentence';

export type PenaltyOnClock = {
   penaltyEventId: number;
   side: Side;
   penaltyClock: PenaltyClock;
   kind: PenaltyKind;
   doubleMinorHalf?: 1 | 2;
   coincidental: boolean;
};

export type ServedPenalty = PenaltyOnClock & {
   start: GameElapsed;
   end: GameElapsed;
   endReason: PenaltyEndReason;
   releasedByGoalId?: number;
};

export type StrengthInterval = Strength & {
   start: GameElapsed;
   end: GameElapsed;
};

export type GoalEffect = {
   goalEventId: number;
   side: Side;
   strength: Strength;
   penaltyShot: boolean;
   releasedPenaltyEventId?: number;
   washedPenaltyId?: number;
};

export type TimelineEntry =
   | { kind: 'strength'; time: GameElapsed; strength: Strength }
   | {
        kind: 'penaltyStart';
        time: GameElapsed;
        penalty: PenaltyOnClock;
        reason: PenaltyStartReason;
     }
   | { kind: 'penaltyEnd'; time: GameElapsed; penalty: ServedPenalty }
   | { kind: 'goal'; time: GameElapsed; goal: GoalEffect };

export type PenaltyEngineResult = {
   timeline: TimelineEntry[];
   servedPenalties: ServedPenalty[];
   strengthIntervals: StrengthInterval[];
   goals: GoalEffect[];
};
