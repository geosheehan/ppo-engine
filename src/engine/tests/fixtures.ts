import type { Game, Play } from '@domain/types';
import { indexGame } from '@domain/game';
import { runPenaltyEngine } from '@engine/penaltyEngine';

export const AWAY = 1;
export const HOME = 2;

let nextId = 1;
const play = (typeDescKey: string, typeCode: number, clock: string, details: object, extra: Partial<Play> = {}): Play => {
   const eventId = nextId++;
   return {
      eventId,
      sortOrder: eventId,
      typeCode,
      typeDescKey,
      periodDescriptor: { number: 1, periodType: 'REG', maxRegulationPeriods: 3 },
      timeInPeriod: clock,
      timeRemaining: '00:00',
      details,
      ...extra,
   };
};

export const penalty = (teamId: number, clock: string, duration: number, typeCode = 'MIN') =>
   play('penalty', 509, clock, { typeCode, descKey: 'tripping', duration, eventOwnerTeamId: teamId, committedByPlayerId: 1000 + nextId });

export const playerPenalty = (teamId: number, playerId: number, clock: string, duration: number, typeCode = 'MIN') =>
   play('penalty', 509, clock, { typeCode, descKey: 'tripping', duration, eventOwnerTeamId: teamId, committedByPlayerId: playerId });

export const goal = (teamId: number, clock: string, situationCode?: string) =>
   play('goal', 505, clock, { eventOwnerTeamId: teamId }, situationCode ? { situationCode } : {});

export const gameEnd = (clock: string) => play('game-end', 524, clock, {});

export const engineFor = (...plays: Play[]) => runPenaltyEngine(indexGame({
   season: 20262027,
   gameType: 2,
   regPeriods: 3,
   homeTeam: { id: HOME, abbrev: 'HOM' },
   awayTeam: { id: AWAY, abbrev: 'AWY' },
   rosterSpots: [],
   plays,
} as unknown as Game));
