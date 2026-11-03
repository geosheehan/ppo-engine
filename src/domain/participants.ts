import { PLAY_TYPES } from '@domain/constants';
import type { Play, PlayType } from '@domain/types';

export type Participant = {
   field: string;
   role: string;
   playerId: number;
};

const ROLES: Partial<Record<PlayType, { field: string; role: string }[]>> = {
   [PLAY_TYPES.FACEOFF]: [{ field: 'winningPlayerId', role: 'Won' }, { field: 'losingPlayerId', role: 'Lost' }],
   [PLAY_TYPES.HIT]: [{ field: 'hittingPlayerId', role: 'Hitter' }, { field: 'hitteePlayerId', role: 'Hit' }],
   [PLAY_TYPES.SHOT_ON_GOAL]: [{ field: 'shootingPlayerId', role: 'Shot' }, { field: 'goalieInNetId', role: 'Goalie' }],
   [PLAY_TYPES.MISSED_SHOT]: [{ field: 'shootingPlayerId', role: 'Shot' }, { field: 'goalieInNetId', role: 'Goalie' }],
   [PLAY_TYPES.BLOCKED_SHOT]: [{ field: 'shootingPlayerId', role: 'Shot' }, { field: 'blockingPlayerId', role: 'Blocked' }],
   [PLAY_TYPES.GOAL]: [
      { field: 'scoringPlayerId', role: 'Goal' },
      { field: 'assist1PlayerId', role: '1st assist' },
      { field: 'assist2PlayerId', role: '2nd assist' },
      { field: 'goalieInNetId', role: 'Goalie' },
   ],
   [PLAY_TYPES.GIVEAWAY]: [{ field: 'playerId', role: 'Giveaway' }],
   [PLAY_TYPES.TAKEAWAY]: [{ field: 'playerId', role: 'Takeaway' }],
   [PLAY_TYPES.PENALTY]: [
      { field: 'committedByPlayerId', role: 'Penalty' },
      { field: 'drawnByPlayerId', role: 'Drawn by' },
      { field: 'servedByPlayerId', role: 'Served by' },
   ],
};

export function playParticipants(play: Play): Participant[] {
   const details = (play.details ?? {}) as Record<string, unknown>;
   const participants: Participant[] = [];
   for (const { field, role } of ROLES[play.typeDescKey] ?? []) {
      const playerId = details[field];
      if (typeof playerId === 'number') participants.push({ field, role, playerId });
   }
   return participants;
}
