import { STRENGTH_SEVERITIES } from '@engine/assessment';
import { PENALTY_SEVERITIES, PENALTY_SHOT_SITUATIONS, PLAY_TYPES } from '@domain/constants';
import type { GameElapsed, GoalPlay, PenaltyPlay, Play } from '@domain/types';
import { isGoal, isPenalty } from '@domain/types';

const PENALTY_SHOT_CODES = new Set<string>(Object.values(PENALTY_SHOT_SITUATIONS));

export class PlayGroup {
   readonly time: GameElapsed;
   readonly goals: GoalPlay[] = [];
   readonly penalties: PenaltyPlay[] = [];
   hasFaceoff = false;

   constructor(time: GameElapsed) {
      this.time = time;
   }

   add(play: Play): void {
      if (isGoal(play)) this.goals.push(play);
      else if (isPenalty(play)) this.penalties.push(play);
      else if (play.typeDescKey === PLAY_TYPES.FACEOFF) this.hasFaceoff = true;
   }

   // Plays from before situationCode was recorded fall back to a PS penalty to the other team in the same second.
   isPenaltyShot(goal: GoalPlay): boolean {
      if (goal.situationCode) return PENALTY_SHOT_CODES.has(goal.situationCode);
      return this.penalties.some(
         (penalty) =>
            penalty.details.typeCode === PENALTY_SEVERITIES.PENALTY_SHOT
            && penalty.details.eventOwnerTeamId !== goal.details.eventOwnerTeamId,
      );
   }

   delayedPenalty(goal: GoalPlay): PenaltyPlay | undefined {
      let delayed: PenaltyPlay | undefined;
      for (const penalty of this.penalties) {
         if (!STRENGTH_SEVERITIES.has(penalty.details.typeCode)) continue;
         if (penalty.details.eventOwnerTeamId === goal.details.eventOwnerTeamId) return undefined;
         delayed ??= penalty;
      }
      return delayed;
   }
}
