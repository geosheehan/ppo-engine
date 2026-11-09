import { buildGamePpo } from '@api/gamePpo';
import type { GameSummary, PpoApi } from '@api/types';
import type { Game, ShiftChart } from '@domain/types';

const LATENCY_MS = 300;
const FILE_NAME = /^(\d{4})(\d{2})(\d{2})-([A-Z]+)v([A-Z]+)$/;

const fileName = (path: string): string =>
   path.slice(path.lastIndexOf('/') + 1).replace(/(-shifts)?\.json$/, '');

const nhlIds = import.meta.glob<number>('@data/games/*.json', { import: 'id', eager: true });
const gameFiles = import.meta.glob<Game>('@data/games/*.json', { import: 'default' });
const shiftFiles = new Map(
   Object.entries(
      import.meta.glob<ShiftChart>('@data/shifts/*-shifts.json', { import: 'default' }),
   ).map(([path, load]) => [fileName(path), load]),
);

type SavedGame = { summary: GameSummary; load: () => Promise<Game>; file: string };

export function gameSummaryFromFile(file: string, id: string): GameSummary | undefined {
   const match = FILE_NAME.exec(file);
   if (match === null) return undefined;
   const [, year, month, day, home, away] = match;
   return { id, date: `${year}-${month}-${day}`, home, away };
}

const savedGames = new Map<string, SavedGame>();
for (const [path, load] of Object.entries(gameFiles)) {
   const file = fileName(path);
   const summary = gameSummaryFromFile(file, String(nhlIds[path]));
   if (summary !== undefined) savedGames.set(summary.id, { summary, load, file });
}

const latency = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

// Dev only (VITE_GAME_SOURCE=local): reads the gitignored games in src/data instead of the Worker.
export const localApi: PpoApi = {
   async listGames() {
      await latency();
      return [...savedGames.values()]
         .map(({ summary }) => summary)
         .toSorted((a, b) => b.date.localeCompare(a.date));
   },

   async getGamePpo(id) {
      const saved = savedGames.get(id);
      if (saved === undefined) throw new Error(`No saved game ${id}`);
      const [game, shiftChart] = await Promise.all([
         saved.load(),
         shiftFiles.get(saved.file)?.(),
         latency(),
      ]);
      return buildGamePpo(game, shiftChart?.data ?? []);
   },
};
