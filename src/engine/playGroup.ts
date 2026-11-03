import type { GameElapsed, GoalPlay, PenaltyPlay, Play } from '@domain/types';
import { isGoal, isPenalty } from '@domain/types';
import { STRENGTH_SEVERITIES } from '@engine/assessment';

// situationCode is [away goalie][away skaters][home skaters][home goalie]; a penalty shot is one skater against a goalie.
const PENALTY_SHOT_CODES = new Set(['0101', '1010']);

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
      else if (play.typeDescKey === 'faceoff') this.hasFaceoff = true;
   }

   // Plays from before situationCode was recorded fall back to a PS penalty to the other team in the same second.
   isPenaltyShot(goal: GoalPlay): boolean {
      if (goal.situationCode) return PENALTY_SHOT_CODES.has(goal.situationCode);
      return this.penalties.some((penalty) => penalty.details.typeCode === 'PS'
         && penalty.details.eventOwnerTeamId !== goal.details.eventOwnerTeamId);
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
