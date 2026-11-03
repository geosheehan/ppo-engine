import { GAME_TYPES, PENALTY_SEVERITIES, PERIOD_TYPES, PLAY_TYPES } from '@domain/constants';
import type { Game, PenaltySeverity, Play, PlayType } from '@domain/types';
import { indexGame } from '@domain/game';
import { runPenaltyEngine } from '@engine/penaltyEngine';

export const AWAY = 1;
export const HOME = 2;

let nextId = 1;
const play = (typeDescKey: PlayType, typeCode: number, clock: string, details: object, extra: Partial<Play> = {}): Play => {
   const eventId = nextId++;
   return {
      eventId,
      sortOrder: eventId,
      typeCode,
      typeDescKey,
      periodDescriptor: { number: 1, periodType: PERIOD_TYPES.REGULATION, maxRegulationPeriods: 3 },
      timeInPeriod: clock,
      timeRemaining: '00:00',
      details,
      ...extra,
   };
};

export const penalty = (teamId: number, clock: string, duration: number, typeCode: PenaltySeverity = PENALTY_SEVERITIES.MINOR) =>
   play(PLAY_TYPES.PENALTY, 509, clock, { typeCode, descKey: 'tripping', duration, eventOwnerTeamId: teamId, committedByPlayerId: 1000 + nextId });

export const playerPenalty = (teamId: number, playerId: number, clock: string, duration: number, typeCode: PenaltySeverity = PENALTY_SEVERITIES.MINOR) =>
   play(PLAY_TYPES.PENALTY, 509, clock, { typeCode, descKey: 'tripping', duration, eventOwnerTeamId: teamId, committedByPlayerId: playerId });

export const goal = (teamId: number, clock: string, situationCode?: string) =>
   play(PLAY_TYPES.GOAL, 505, clock, { eventOwnerTeamId: teamId }, situationCode ? { situationCode } : {});

export const gameEnd = (clock: string) => play(PLAY_TYPES.GAME_END, 524, clock, {});

export const engineFor = (...plays: Play[]) => runPenaltyEngine(indexGame({
   season: 20262027,
   gameType: GAME_TYPES.REGULAR_SEASON,
   regPeriods: 3,
   homeTeam: { id: HOME, abbrev: 'HOM' },
   awayTeam: { id: AWAY, abbrev: 'AWY' },
   rosterSpots: [],
   plays,
} as unknown as Game));
