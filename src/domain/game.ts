import type { Game } from '@domain/types';
import { isPenalty } from '@domain/types';

export function indexGame(game: Game) {
    const teamsById = new Map([game.homeTeam, game.awayTeam].map((team) => [team.id, team]));
    const playersById = new Map(game.rosterSpots.map((player) => [player.playerId, player]));
    return {
        game,
        penalties: game.plays.filter(isPenalty),
        teamById: (teamId: number) => teamsById.get(teamId),
        playerById: (playerId: number) => playersById.get(playerId),
        teamByHomeOrAway: (homeOrAway: "home" | "away") => homeOrAway === "home" ? game.homeTeam : game.awayTeam,
    };
};

export type GameIndex = ReturnType<typeof indexGame>;
