import { PLAY_TYPES } from '@domain/constants';
import type { Play } from '@domain/types';

export type Participant = {
   field: string;
   role: string;
   playerId: number;
};

// The named players in a play's details, in the order given. Field names are checked against that play type's details.
function named<D extends object>(
   details: D,
   ...roles: [field: keyof D & string, role: string][]
): Participant[] {
   return roles.flatMap(([field, role]) => {
      const playerId = details[field];
      return typeof playerId === 'number' ? [{ field, role, playerId }] : [];
   });
}

export function playParticipants(play: Play): Participant[] {
   switch (play.typeDescKey) {
      case PLAY_TYPES.FACEOFF:
         return named(play.details, ['winningPlayerId', 'Won'], ['losingPlayerId', 'Lost']);
      case PLAY_TYPES.HIT:
         return named(play.details, ['hittingPlayerId', 'Hitter'], ['hitteePlayerId', 'Hit']);
      case PLAY_TYPES.SHOT_ON_GOAL:
      case PLAY_TYPES.MISSED_SHOT:
         return named(play.details, ['shootingPlayerId', 'Shot'], ['goalieInNetId', 'Goalie']);
      case PLAY_TYPES.BLOCKED_SHOT:
         return named(play.details, ['shootingPlayerId', 'Shot'], ['blockingPlayerId', 'Blocked']);
      case PLAY_TYPES.GOAL:
         return named(
            play.details,
            ['scoringPlayerId', 'Goal'],
            ['assist1PlayerId', '1st assist'],
            ['assist2PlayerId', '2nd assist'],
            ['goalieInNetId', 'Goalie'],
         );
      case PLAY_TYPES.GIVEAWAY:
         return named(play.details, ['playerId', 'Giveaway']);
      case PLAY_TYPES.TAKEAWAY:
         return named(play.details, ['playerId', 'Takeaway']);
      case PLAY_TYPES.PENALTY:
         return named(
            play.details,
            ['committedByPlayerId', 'Penalty'],
            ['drawnByPlayerId', 'Drawn by'],
            ['servedByPlayerId', 'Served by'],
         );
      default:
         return [];
   }
}
