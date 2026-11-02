import { matchupColors } from '@domain/colors';
import { TEAM_COLORS } from '@domain/teamColors';
import { timedShifts } from '@domain/onIce';
import type { Game, Shift, Team } from '@domain/types';
import { isPenalty } from '@domain/types';

// Gray for tri-codes not in the color map yet.
const teamColors = (team: Team): string[] => TEAM_COLORS[team.abbrev] ?? ['#6b6b6b'];

export function indexGame(game: Game, shifts: Shift[] = []) {
   const teamsById = new Map([game.homeTeam, game.awayTeam].map((team) => [team.id, team]));
   const playersById = new Map(game.rosterSpots.map((player) => [player.playerId, player]));
   const colors = matchupColors(teamColors(game.homeTeam), teamColors(game.awayTeam));
   return {
      game,
      penalties: game.plays.filter(isPenalty),
      shifts: timedShifts(shifts),
      colors,
      teamById: (teamId: number) => teamsById.get(teamId),
      playerById: (playerId: number) => playersById.get(playerId),
      teamByHomeOrAway: (homeOrAway: "home" | "away") => homeOrAway === "home" ? game.homeTeam : game.awayTeam,
      teamColor: (teamId: number) => teamId === game.homeTeam.id ? colors.home : colors.away,
   };
};

export type GameIndex = ReturnType<typeof indexGame>;
