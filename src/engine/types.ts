import type { Side } from '@domain/types';

export type PenaltyClock = 0 | 1;

export type Strength = Record<Side, number>;

export type PenaltyKind = 'minor' | 'major';

export type PenaltyEndReason = 'expired' | 'goal' | 'gameEnd' | 'projected';

export type ServedPenalty = {
   penaltyEventId: number;
   side: Side;
   penaltyClock: PenaltyClock;
   kind: PenaltyKind;
   doubleMinorHalf?: 1 | 2;
   start: number;
   end: number;
   endReason: PenaltyEndReason;
   releasedByGoalId?: number;
   coincidental: boolean;
};

export type StrengthInterval = Strength & {
   start: number;
   end: number;
};

export type GoalEffect = {
   goalEventId: number;
   side: Side;
   strength: Strength;
   penaltyShot: boolean;
   releasedPenaltyEventId?: number;
   washedDoubleMinorId?: number;
};

export type PenaltyEngineResult = {
   servedPenalties: ServedPenalty[];
   strengthIntervals: StrengthInterval[];
   goals: GoalEffect[];
};
