import { clockToSeconds, gameSeconds, PERIOD_SECONDS } from '@domain/clock';
import { PLAY_TYPES } from '@domain/constants';
import { isGoal, isPenalty } from '@domain/types';
import type { GameElapsed, PenaltyPlay, Play, Side } from '@domain/types';

export const playTime = (play: Play): GameElapsed => gameSeconds(play.periodDescriptor.number, play.timeInPeriod);

// Game time first; sortOrder breaks ties between plays in the same second.
export const byGameOrder = (a: Play, b: Play) => playTime(a) - playTime(b) || a.sortOrder - b.sortOrder;

export const periodTimeLeft = (play: Play, time: GameElapsed): number => {
   const periodStart = (play.periodDescriptor.number - 1) * PERIOD_SECONDS;
   const periodLength = clockToSeconds(play.timeInPeriod) + clockToSeconds(play.timeRemaining);
   return periodLength - (time - periodStart);
};

// The penalty a delayed-penalty signal turned into: the first penalty by the same team after it. A faceoff
// first means play restarted without the call, so a goal washed it out. `plays` must be in game order.
export function delayedPenaltyCall(plays: Play[], index: number): PenaltyPlay | undefined {
   const teamId = (plays[index].details as { eventOwnerTeamId?: number } | undefined)?.eventOwnerTeamId;
   for (let next = index + 1; next < plays.length; next++) {
      const play = plays[next];
      if (play.typeDescKey === PLAY_TYPES.FACEOFF) return undefined;
      if (isPenalty(play) && play.details.eventOwnerTeamId === teamId) return play;
   }
   return undefined;
}

export type Score = Record<Side, number>;

export function runningScores(plays: Play[]): Score[] {
   let score: Score = { away: 0, home: 0 };
   return plays.map((play) => {
      if (isGoal(play)) score = { away: play.details.awayScore, home: play.details.homeScore };
      return score;
   });
}
