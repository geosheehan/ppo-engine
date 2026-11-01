import type { Play } from '@domain/types';

export type Participant = {
   field: string;
   role: string;
   playerId: number;
};

const ROLES: Record<string, { field: string; role: string }[]> = {
   'faceoff': [{ field: 'winningPlayerId', role: 'Won' }, { field: 'losingPlayerId', role: 'Lost' }],
   'hit': [{ field: 'hittingPlayerId', role: 'Hitter' }, { field: 'hitteePlayerId', role: 'Hit' }],
   'shot-on-goal': [{ field: 'shootingPlayerId', role: 'Shot' }, { field: 'goalieInNetId', role: 'Goalie' }],
   'missed-shot': [{ field: 'shootingPlayerId', role: 'Shot' }, { field: 'goalieInNetId', role: 'Goalie' }],
   'blocked-shot': [{ field: 'shootingPlayerId', role: 'Shot' }, { field: 'blockingPlayerId', role: 'Blocked' }],
   'goal': [
      { field: 'scoringPlayerId', role: 'Goal' },
      { field: 'assist1PlayerId', role: '1st assist' },
      { field: 'assist2PlayerId', role: '2nd assist' },
      { field: 'goalieInNetId', role: 'Goalie' },
   ],
   'giveaway': [{ field: 'playerId', role: 'Giveaway' }],
   'takeaway': [{ field: 'playerId', role: 'Takeaway' }],
   'penalty': [
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
