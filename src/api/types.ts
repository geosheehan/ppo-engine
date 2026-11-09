import type { PenaltyEngineResult, PowerPlayCount } from '@engine/types';
import type { Game, ScheduleWeek, Shift } from '@domain/types';

export type GameSummary = {
   id: string;
   date: string;
   home: string;
   away: string;
};

export type GamePpo = {
   game: Game;
   shifts: Shift[];
   penaltyResult: PenaltyEngineResult;
   powerPlays: PowerPlayCount;
};

export type PpoApi = {
   listGames: () => Promise<GameSummary[]>;
   getGamePpo: (id: string) => Promise<GamePpo>;
   getSchedule: (weekStart: string) => Promise<ScheduleWeek>;
};
