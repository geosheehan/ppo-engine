import { loadHeadshot } from '@api/headshots';
import type { GameSummary, PpoApi } from '@api/types';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { countPowerPlays } from '@engine/powerPlayCounter';
import { indexGame } from '@domain/game';
import type { Game, ShiftChart } from '@domain/types';

const LATENCY_MS = 300;
const GAME_ID = /^(\d{4})(\d{2})(\d{2})-([A-Z]+)v([A-Z]+)$/;

const fileId = (path: string): string =>
   path.slice(path.lastIndexOf('/') + 1).replace(/(-shifts)?\.json$/, '');

const byId = <T>(files: Record<string, () => Promise<T>>) =>
   new Map(Object.entries(files).map(([path, load]) => [fileId(path), load]));

// Not eager: each file becomes its own chunk, loaded only when its game is asked for.
const gameFiles = byId(import.meta.glob<Game>('@data/games/*.json', { import: 'default' }));
const shiftFiles = byId(
   import.meta.glob<ShiftChart>('@data/shifts/*-shifts.json', { import: 'default' }),
);

const latency = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

export function gameSummaryFromId(id: string): GameSummary | undefined {
   const match = GAME_ID.exec(id);
   if (match === null) return undefined;
   const [, year, month, day, home, away] = match;
   return { id, date: `${year}-${month}-${day}`, home, away };
}

export const localApi: PpoApi = {
   async listGames() {
      await latency();
      return [...gameFiles.keys()]
         .map((id) => gameSummaryFromId(id))
         .filter((summary) => summary !== undefined)
         .toSorted((a, b) => b.date.localeCompare(a.date));
   },

   async getGamePpo(id) {
      const loadGame = gameFiles.get(id);
      if (loadGame === undefined) throw new Error(`No saved game ${id}`);
      const loadShifts = shiftFiles.get(id);
      const [game, shiftChart] = await Promise.all([loadGame(), loadShifts?.(), latency()]);
      // Wait for every headshot so cards never flash the placeholder; a failed one doesn't block.
      await Promise.all(game.rosterSpots.map((player) => loadHeadshot(player.headshot)));
      const shifts = shiftChart?.data ?? [];
      const penaltyResult = runPenaltyEngine(indexGame(game, shifts));
      return {
         game,
         shifts,
         penaltyResult,
         powerPlays: countPowerPlays(penaltyResult.timeline),
      };
   },
};
