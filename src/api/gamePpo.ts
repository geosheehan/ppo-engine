import { loadHeadshot } from '@api/headshots';
import type { GamePpo } from '@api/types';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { countPowerPlays } from '@engine/powerPlayCounter';
import { indexGame } from '@domain/game';
import type { Game, Shift } from '@domain/types';

export async function buildGamePpo(game: Game, shifts: Shift[]): Promise<GamePpo> {
   // Wait for every headshot so cards never flash the placeholder; a failed one doesn't block.
   await Promise.all(game.rosterSpots.map((player) => loadHeadshot(player.headshot)));
   const penaltyResult = runPenaltyEngine(indexGame(game, shifts));
   return { game, shifts, penaltyResult, powerPlays: countPowerPlays(penaltyResult.timeline) };
}
