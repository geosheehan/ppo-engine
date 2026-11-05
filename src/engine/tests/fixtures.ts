import { runPenaltyEngine } from '@engine/penaltyEngine';
import { GAME_TYPES, PENALTY_SEVERITIES, PERIOD_TYPES, PLAY_TYPES } from '@domain/constants';
import { indexGame } from '@domain/game';
import type { Game, GameType, GoalPlay, PenaltyPlay, PenaltySeverity, Play } from '@domain/types';

export const AWAY = 1;
export const HOME = 2;

const GAME_TYPE = GAME_TYPES.REGULAR_SEASON as GameType;
const REG_PERIODS = 3;

const periodDescriptor = (period: number) => ({
   number: period,
   periodType:
      period <= REG_PERIODS
         ? PERIOD_TYPES.REGULATION
         : GAME_TYPE === GAME_TYPES.PLAYOFFS || period === REG_PERIODS + 1
           ? PERIOD_TYPES.OVERTIME
           : PERIOD_TYPES.SHOOTOUT,
   maxRegulationPeriods: REG_PERIODS,
});

let nextId = 1;
const base = (clock: string, period = 1) => {
   const eventId = nextId++;
   return {
      eventId,
      sortOrder: eventId,
      typeCode: 0,
      periodDescriptor: periodDescriptor(period),
      timeInPeriod: clock,
      timeRemaining: '00:00',
   };
};

export const inPeriod = <T extends Play>(play: T, period: number): T => ({
   ...play,
   periodDescriptor: periodDescriptor(period),
});

export const penalty = (
   teamId: number,
   clock: string,
   duration: number,
   typeCode: PenaltySeverity = PENALTY_SEVERITIES.MINOR,
): PenaltyPlay => playerPenalty(teamId, 1000 + nextId, clock, duration, typeCode);

export const playerPenalty = (
   teamId: number,
   playerId: number,
   clock: string,
   duration: number,
   typeCode: PenaltySeverity = PENALTY_SEVERITIES.MINOR,
): PenaltyPlay => ({
   ...base(clock),
   typeDescKey: PLAY_TYPES.PENALTY,
   details: {
      typeCode,
      descKey: 'tripping',
      duration,
      eventOwnerTeamId: teamId,
      committedByPlayerId: playerId,
   },
});

export const goal = (teamId: number, clock: string, situationCode?: string): GoalPlay => ({
   ...base(clock),
   ...(situationCode !== undefined ? { situationCode } : {}),
   typeDescKey: PLAY_TYPES.GOAL,
   details: {
      eventOwnerTeamId: teamId,
      shotType: 'wrist',
      scoringPlayerId: 1,
      scoringPlayerTotal: 1,
      awayScore: 0,
      homeScore: 0,
   },
});

export const gameEnd = (clock: string, period = 1): Play => ({
   ...base(clock, period),
   typeDescKey: PLAY_TYPES.GAME_END,
});

export const periodEnd = (clock: string, period = 1): Play => ({
   ...base(clock, period),
   typeDescKey: PLAY_TYPES.PERIOD_END,
});

export const faceoff = (clock: string, period = 1): Play => ({
   ...base(clock, period),
   typeDescKey: PLAY_TYPES.FACEOFF,
   details: { eventOwnerTeamId: HOME, winningPlayerId: 1, losingPlayerId: 2 },
});

export const engineFor = (...plays: Play[]) =>
   runPenaltyEngine(
      indexGame({
         season: 20262027,
         gameType: GAME_TYPE,
         regPeriods: REG_PERIODS,
         homeTeam: { id: HOME, abbrev: 'HOM' },
         awayTeam: { id: AWAY, abbrev: 'AWY' },
         rosterSpots: [],
         plays,
      } as unknown as Game),
   );
