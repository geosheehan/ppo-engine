import { DEFENDING_SIDES, PLAY_TYPES, ZONE_CODES } from '@domain/constants';
import type { Game, HomeTeamDefendingSide, Play } from '@domain/types';

const otherEnd = (side: HomeTeamDefendingSide): HomeTeamDefendingSide =>
   side === DEFENDING_SIDES.LEFT ? DEFENDING_SIDES.RIGHT : DEFENDING_SIDES.LEFT;

// Which end the home team defends, judged from one play. Null when the play can't tell us:
// no location, the neutral zone, or a blocked shot (owned by the blocking team, but zoned for the shooter).
function sideFromLocation(play: Play, homeTeamId: number): HomeTeamDefendingSide | null {
   if (play.typeDescKey === PLAY_TYPES.BLOCKED_SHOT || !play.details) return null;
   const { xCoord, zoneCode, eventOwnerTeamId } = play.details;
   if (
      !xCoord
      || !eventOwnerTeamId
      || (zoneCode !== ZONE_CODES.OFFENSIVE && zoneCode !== ZONE_CODES.DEFENSIVE)
   )
      return null;

   // In its offensive zone the owner is at the far end from its own net.
   const endOfPlay: HomeTeamDefendingSide =
      xCoord < 0 ? DEFENDING_SIDES.LEFT : DEFENDING_SIDES.RIGHT;
   const ownerDefends = zoneCode === ZONE_CODES.DEFENSIVE ? endOfPlay : otherEnd(endOfPlay);
   return eventOwnerTeamId === homeTeamId ? ownerDefends : otherEnd(ownerDefends);
}

// The end the home team defends in each period. Uses the recorded side when the game has one;
// older games don't, so those are a majority vote over the plays in the offensive and defensive zones.
// A period with no evidence takes the opposite end from the period before (left for the first).
export function homeDefendingSides(game: Game): Map<number, HomeTeamDefendingSide> {
   const votes = new Map<number, { left: number; right: number }>();
   const recorded = new Map<number, HomeTeamDefendingSide>();

   for (const play of game.plays) {
      const period = play.periodDescriptor.number;
      if (play.homeTeamDefendingSide) recorded.set(period, play.homeTeamDefendingSide);
      const side = sideFromLocation(play, game.homeTeam.id);
      if (!side) continue;
      const tally = votes.get(period) ?? { left: 0, right: 0 };
      tally[side]++;
      votes.set(period, tally);
   }

   const periods = [...new Set(game.plays.map((play) => play.periodDescriptor.number))].toSorted(
      (a, b) => a - b,
   );
   const sides = new Map<number, HomeTeamDefendingSide>();
   let previous: HomeTeamDefendingSide | undefined;
   for (const period of periods) {
      const tally = votes.get(period);
      const side =
         recorded.get(period)
         ?? (tally && tally.left !== tally.right
            ? tally.left > tally.right
               ? DEFENDING_SIDES.LEFT
               : DEFENDING_SIDES.RIGHT
            : undefined)
         ?? (previous ? otherEnd(previous) : DEFENDING_SIDES.LEFT);
      sides.set(period, side);
      previous = side;
   }
   return sides;
}
