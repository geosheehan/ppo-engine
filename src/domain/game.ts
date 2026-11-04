import { matchupColors } from '@domain/colors';
import { SIDES } from '@domain/constants';
import { indexOnIce, timedShifts } from '@domain/onIce';
import type { OnIceIndex, TimedShift } from '@domain/onIce';
import { byGameOrder } from '@domain/plays';
import { TEAM_COLORS } from '@domain/teamColors';
import type { Game, PenaltyPlay, Play, Player, Shift, Side, Team } from '@domain/types';
import { isPenalty } from '@domain/types';

export type GameIndex = {
   game: Game;
   // In game order; game.plays keeps the order the feed sent them in.
   plays: Play[];
   penalties: PenaltyPlay[];
   shifts: TimedShift[];
   onIceIndex: OnIceIndex;
   colors: { home: string; away: string };
   teamById: (teamId: number) => Team | undefined;
   playerById: (playerId: number) => Player | undefined;
   teamByHomeOrAway: (side: Side) => Team;
   sideOf: (teamId: number) => Side;
   teamColor: (teamId: number) => string;
};

// Gray for tri-codes not in the color map yet.
const teamColors = (team: Team): string[] => TEAM_COLORS[team.abbrev] ?? ['#6b6b6b'];

export function indexGame(game: Game, shifts: Shift[] = []): GameIndex {
   const teamsById = new Map([game.homeTeam, game.awayTeam].map((team) => [team.id, team]));
   const playersById = new Map(game.rosterSpots.map((player) => [player.playerId, player]));
   const colors = matchupColors(teamColors(game.homeTeam), teamColors(game.awayTeam));
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
