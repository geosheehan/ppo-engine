import { gameColors } from '@domain/colors';
import { SIDES } from '@domain/constants';
import { indexOnIce, timedShifts } from '@domain/onIce';
import { byGameOrder, isPenalty } from '@domain/plays';
import { TEAM_COLORS } from '@domain/teamColors';
import type { Game, GameIndex, Shift, Side } from '@domain/types';

export function indexGame(game: Game, shifts: Shift[] = []): GameIndex {
   const teamsById = new Map([game.homeTeam, game.awayTeam].map((team) => [team.id, team]));
   const playersById = new Map(game.rosterSpots.map((player) => [player.playerId, player]));
   const colors = gameColors(TEAM_COLORS[game.homeTeam.abbrev], TEAM_COLORS[game.awayTeam.abbrev]);
   const sideOf = (teamId: number): Side => (teamId === game.homeTeam.id ? SIDES.HOME : SIDES.AWAY);
   const plays = game.plays.toSorted(byGameOrder);
   const timed = timedShifts(shifts);
   return {
      game,
      plays,
      penalties: plays.filter(isPenalty),
      shifts: timed,
      onIceIndex: indexOnIce(timed),
      colors,
      teamById: (teamId) => teamsById.get(teamId),
      playerById: (playerId) => playersById.get(playerId),
      teamByHomeOrAway: (homeOrAway) => (homeOrAway === SIDES.HOME ? game.homeTeam : game.awayTeam),
      sideOf,
      teamColor: (teamId) => colors[sideOf(teamId)],
   };
}

export const otherSide = (side: Side): Side => (side === SIDES.HOME ? SIDES.AWAY : SIDES.HOME);
