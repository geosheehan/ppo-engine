import { isPenalty } from '@domain/types';
import type { PenaltyPlay, Play } from '@domain/types';

export const EVENT_TYPES: string[] = [
   'blocked-shot',
   'delayed-penalty',
   'faceoff',
   'giveaway',
   'goal',
   'hit',
   'missed-shot',
   'penalty',
   'period-end',
   'period-start',
   'shot-on-goal',
   'stoppage',
   'takeaway',
];

export const periodLabel = (play: Play): string =>
   play.periodDescriptor.periodType === 'REG' ? `P${play.periodDescriptor.number}` : play.periodDescriptor.periodType;

export const playTypeLabel =(typeDescKey: string): string => {
   const words = typeDescKey.replaceAll('-', ' ');
   return words.charAt(0).toUpperCase() + words.slice(1);
};

// The penalty a delayed-penalty signal turned into: the first penalty by the same team after it. A faceoff
// first means play restarted without the call, so a goal washed it out. `plays` must be in game order.
export function delayedPenaltyCall(plays: Play[], index: number): PenaltyPlay | undefined {
   const teamId = (plays[index].details as { eventOwnerTeamId?: number } | undefined)?.eventOwnerTeamId;
   for (const play of plays.slice(index + 1)) {
      if (play.typeDescKey === 'faceoff') return undefined;
      if (isPenalty(play) && play.details.eventOwnerTeamId === teamId) return play;
   }
   return undefined;
}
