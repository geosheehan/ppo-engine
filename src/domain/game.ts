import { matchupColors } from '@domain/colors';
import { TEAM_COLORS } from '@domain/teamColors';
import { timedShifts } from '@domain/onIce';
import type { TimedShift } from '@domain/onIce';
import type { Game, PenaltyPlay, Player, Shift, Team } from '@domain/types';
import { isPenalty } from '@domain/types';

export type GameIndex = {
   game: Game;
   penalties: PenaltyPlay[];
   shifts: TimedShift[];
   colors: { home: string; away: string };
   teamById: (teamId: number) => Team | undefined;
   playerById: (playerId: number) => Player | undefined;
   teamByHomeOrAway: (homeOrAway: 'home' | 'away') => Team;
   teamColor: (teamId: number) => string;
};

// Gray for tri-codes not in the color map yet.
const teamColors = (team: Team): string[] => TEAM_COLORS[team.abbrev] ?? ['#6b6b6b'];

export function indexGame(game: Game, shifts: Shift[] = []): GameIndex {
   const teamsById = new Map([game.homeTeam, game.awayTeam].map((team) => [team.id, team]));
   const playersById = new Map(game.rosterSpots.map((player) => [player.playerId, player]));
   const colors = matchupColors(teamColors(game.homeTeam), teamColors(game.awayTeam));
   return {
      game,
      penalties: game.plays.filter(isPenalty),
      shifts: timedShifts(shifts),
      colors,
      teamById: (teamId) => teamsById.get(teamId),
      playerById: (playerId) => playersById.get(playerId),
      teamByHomeOrAway: (homeOrAway) => (homeOrAway === 'home' ? game.homeTeam : game.awayTeam),
      teamColor: (teamId) => (teamId === game.homeTeam.id ? colors.home : colors.away),
   };
}
