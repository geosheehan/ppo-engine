import { secondsToClock } from '@domain/clock';
import {
   GAME_TYPES,
   PENALTY_SEVERITIES,
   PERIOD_SECONDS,
   PERIOD_TYPES,
   PLAY_TYPES,
   SIDES,
} from '@domain/constants';
import type {
   Game,
   GameElapsed,
   GoalPlay,
   PenaltyPlay,
   PenaltySeverity,
   Play,
   Player,
   Side,
   Team,
} from '@domain/types';

export const SCENARIO_PERIODS = 3;
export const SCENARIO_SECONDS = SCENARIO_PERIODS * PERIOD_SECONDS;
export const SCENARIO_SNAP_SECONDS = 5;
export const SCENARIO_LAST_TIME = SCENARIO_SECONDS - SCENARIO_SNAP_SECONDS;

export const SCENARIO_PENALTIES = {
   MINOR: 'minor',
   DOUBLE_MINOR: 'double-minor',
   MAJOR: 'major',
} as const;

export type ScenarioPenaltyType = (typeof SCENARIO_PENALTIES)[keyof typeof SCENARIO_PENALTIES];

type PenaltyRule = {
   label: string;
   minutes: number;
   severity: PenaltySeverity;
   descKey: string;
};

export const SCENARIO_PENALTY_RULES: Record<ScenarioPenaltyType, PenaltyRule> = {
   [SCENARIO_PENALTIES.MINOR]: {
      label: 'Minor',
      minutes: 2,
      severity: PENALTY_SEVERITIES.MINOR,
      descKey: 'tripping',
   },
   [SCENARIO_PENALTIES.DOUBLE_MINOR]: {
      label: 'Double minor',
      minutes: 4,
      severity: PENALTY_SEVERITIES.MINOR,
      descKey: 'high-sticking',
   },
   [SCENARIO_PENALTIES.MAJOR]: {
      label: 'Major',
      minutes: 5,
      severity: PENALTY_SEVERITIES.MAJOR,
      descKey: 'fighting',
   },
};

export type ScenarioPenalty = {
   id: number;
   kind: 'penalty';
   side: Side;
   time: GameElapsed;
   penaltyType: ScenarioPenaltyType;
};

export type ScenarioGoal = {
   id: number;
   kind: 'goal';
   side: Side;
   time: GameElapsed;
};

export type ScenarioEvent = ScenarioPenalty | ScenarioGoal;

export const SCENARIO_TEAM_IDS: Record<Side, number> = { away: 1, home: 2 };

const SCENARIO_TEAMS: Record<Side, Team> = {
   away: scenarioTeam(SIDES.AWAY, 'AWY', 'Away'),
   home: scenarioTeam(SIDES.HOME, 'HOM', 'Home'),
};

function scenarioTeam(side: Side, abbrev: string, name: string): Team {
   return {
      id: SCENARIO_TEAM_IDS[side],
      abbrev,
      commonName: { default: name },
      placeName: { default: name },
      sog: 0,
      logo: '',
      darkLogo: '',
   };
}

export const snapTime = (seconds: number): GameElapsed =>
   Math.min(
      SCENARIO_LAST_TIME,
      Math.max(0, Math.round(seconds / SCENARIO_SNAP_SECONDS) * SCENARIO_SNAP_SECONDS),
   );

export const penaltySeconds = (penaltyType: ScenarioPenaltyType): number =>
   SCENARIO_PENALTY_RULES[penaltyType].minutes * 60;

// The penalty type whose length is closest to `seconds`; a tie goes to the shorter one.
export function nearestPenaltyType(seconds: number): ScenarioPenaltyType {
   let nearest: ScenarioPenaltyType = SCENARIO_PENALTIES.MINOR;
   for (const penaltyType of Object.values(SCENARIO_PENALTIES)) {
      if (
         Math.abs(penaltySeconds(penaltyType) - seconds)
         < Math.abs(penaltySeconds(nearest) - seconds)
      )
         nearest = penaltyType;
   }
   return nearest;
}

// An event on a period break belongs to the period that starts there.
export const scenarioPeriod = (time: GameElapsed): number =>
   Math.min(SCENARIO_PERIODS, Math.floor(time / PERIOD_SECONDS) + 1);

export const scenarioClock = (time: GameElapsed): string =>
   secondsToClock(time - (scenarioPeriod(time) - 1) * PERIOD_SECONDS);

// The player who takes a scenario penalty. Each penalty gets its own player, numbered like the penalty.
export const scenarioPlayerId = (penaltyId: number): number => 1000 + penaltyId;

const clockPad = (seconds: number): string => {
   const clock = secondsToClock(seconds);
   return clock.length < 5 ? `0${clock}` : clock;
};

const periodDescriptor = (period: number) => ({
   number: period,
   periodType: PERIOD_TYPES.REGULATION,
   maxRegulationPeriods: SCENARIO_PERIODS,
});

// Period plays come before scenario events at the same second (sortOrder breaks ties in game order).
function periodPlay(
   typeDescKey:
      typeof PLAY_TYPES.PERIOD_START | typeof PLAY_TYPES.PERIOD_END | typeof PLAY_TYPES.GAME_END,
   period: number,
   sortOrder: number,
): Play {
   const atEnd = typeDescKey !== PLAY_TYPES.PERIOD_START;
   return {
      eventId: 900_000 + sortOrder,
      sortOrder,
      typeCode: 0,
      typeDescKey,
      periodDescriptor: periodDescriptor(period),
      timeInPeriod: clockPad(atEnd ? PERIOD_SECONDS : 0),
      timeRemaining: clockPad(atEnd ? 0 : PERIOD_SECONDS),
   };
}

function eventBase(event: ScenarioEvent, sortOrder: number) {
   const period = scenarioPeriod(event.time);
   const inPeriod = event.time - (period - 1) * PERIOD_SECONDS;
   return {
      eventId: event.id,
      sortOrder,
      typeCode: 0,
      periodDescriptor: periodDescriptor(period),
      timeInPeriod: clockPad(inPeriod),
      timeRemaining: clockPad(PERIOD_SECONDS - inPeriod),
   };
}

// Builds a regulation-only game from hand-placed events, so the real engine can run on it.
// Events at the same second keep the order they were added in.
export function scenarioGame(events: ScenarioEvent[]): Game {
   const periodPlays = Array.from({ length: SCENARIO_PERIODS }, (_, i) => [
      periodPlay(PLAY_TYPES.PERIOD_START, i + 1, i * 2),
      periodPlay(PLAY_TYPES.PERIOD_END, i + 1, i * 2 + 1),
   ]).flat();
   const gameEnd = periodPlay(PLAY_TYPES.GAME_END, SCENARIO_PERIODS, SCENARIO_PERIODS * 2);

   const ordered = events
      .map((event, i) => ({ event, sortOrder: 100 + i }))
      .toSorted((a, b) => a.event.time - b.event.time || a.sortOrder - b.sortOrder);
   const score = { away: 0, home: 0 };
   const eventPlays = ordered.map(({ event, sortOrder }): Play => {
      const teamId = SCENARIO_TEAM_IDS[event.side];
      if (event.kind === 'goal') {
         score[event.side] += 1;
         const goal: GoalPlay = {
            ...eventBase(event, sortOrder),
            typeDescKey: PLAY_TYPES.GOAL,
            details: {
               eventOwnerTeamId: teamId,
               shotType: 'wrist',
               scoringPlayerId: 0,
               scoringPlayerTotal: score[event.side],
               awayScore: score.away,
               homeScore: score.home,
            },
         };
         return goal;
      }
      const rule = SCENARIO_PENALTY_RULES[event.penaltyType];
      const penalty: PenaltyPlay = {
         ...eventBase(event, sortOrder),
         typeDescKey: PLAY_TYPES.PENALTY,
         details: {
            eventOwnerTeamId: teamId,
            typeCode: rule.severity,
            descKey: rule.descKey,
            duration: rule.minutes,
            committedByPlayerId: scenarioPlayerId(event.id),
         },
      };
      return penalty;
   });

   const rosterSpots: Player[] = events
      .filter((event) => event.kind === 'penalty')
      .map((penalty) => ({
         teamId: SCENARIO_TEAM_IDS[penalty.side],
         playerId: scenarioPlayerId(penalty.id),
         firstName: { default: 'Player' },
         lastName: { default: String(penalty.id) },
         sweaterNumber: penalty.id,
         positionCode: 'C',
         headshot: '',
      }));

   return {
      season: 20262027,
      gameType: GAME_TYPES.REGULAR_SEASON,
      regPeriods: SCENARIO_PERIODS,
      awayTeam: SCENARIO_TEAMS.away,
      homeTeam: SCENARIO_TEAMS.home,
      plays: [...periodPlays, ...eventPlays, gameEnd],
      rosterSpots,
   };
}
