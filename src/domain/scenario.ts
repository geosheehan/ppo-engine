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

export const SCENARIO_SNAP_SECONDS = 5;

export const SCENARIO_GAME_TYPES = {
   REGULAR: 'regular',
   PLAYOFF: 'playoff',
} as const;

export type ScenarioGameType = (typeof SCENARIO_GAME_TYPES)[keyof typeof SCENARIO_GAME_TYPES];

export type ScenarioSetup = {
   gameType: ScenarioGameType;
   regulation: number;
   overtime: number;
};

export const DEFAULT_SETUP: ScenarioSetup = {
   gameType: SCENARIO_GAME_TYPES.REGULAR,
   regulation: 1,
   overtime: 0,
};

export const MAX_REGULATION_PERIODS = 3;

export const MAX_OVERTIME_PERIODS: Record<ScenarioGameType, number> = {
   [SCENARIO_GAME_TYPES.REGULAR]: 1,
   [SCENARIO_GAME_TYPES.PLAYOFF]: 2,
};

const REGULAR_OVERTIME_SECONDS = 5 * 60;

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

export type ScenarioStoppage = {
   id: number;
   kind: 'stoppage';
   time: GameElapsed;
};

export type ScenarioEvent = ScenarioPenalty | ScenarioGoal | ScenarioStoppage;

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

export const periodCount = ({ regulation, overtime }: ScenarioSetup): number =>
   regulation + overtime;

export const isOvertimePeriod = (setup: ScenarioSetup, period: number): boolean =>
   period > setup.regulation;

export const periodStart = (period: number): GameElapsed => (period - 1) * PERIOD_SECONDS;

export const periodLength = (setup: ScenarioSetup, period: number): number =>
   isOvertimePeriod(setup, period) && setup.gameType === SCENARIO_GAME_TYPES.REGULAR
      ? REGULAR_OVERTIME_SECONDS
      : PERIOD_SECONDS;

export const scenarioSeconds = (setup: ScenarioSetup): GameElapsed => {
   const last = periodCount(setup);
   return periodStart(last) + periodLength(setup, last);
};

export const lastEventTime = (setup: ScenarioSetup): GameElapsed =>
   scenarioSeconds(setup) - SCENARIO_SNAP_SECONDS;

export const snapTime = (seconds: number, setup: ScenarioSetup): GameElapsed =>
   Math.min(
      lastEventTime(setup),
      Math.max(0, Math.round(seconds / SCENARIO_SNAP_SECONDS) * SCENARIO_SNAP_SECONDS),
   );

export const scenarioPeriod = (time: GameElapsed, setup: ScenarioSetup): number =>
   Math.min(periodCount(setup), Math.floor(time / PERIOD_SECONDS) + 1);

export const scenarioClock = (time: GameElapsed, setup: ScenarioSetup): string =>
   secondsToClock(time - periodStart(scenarioPeriod(time, setup)));

export const eventsWithin = (events: ScenarioEvent[], setup: ScenarioSetup): ScenarioEvent[] =>
   events.filter((event) => {
      const period = Math.floor(event.time / PERIOD_SECONDS) + 1;
      return (
         period <= periodCount(setup)
         && event.time - periodStart(period) < periodLength(setup, period)
      );
   });

export function overtimeWinner(
   events: ScenarioEvent[],
   setup: ScenarioSetup,
): ScenarioGoal | undefined {
   return events
      .filter(
         (event): event is ScenarioGoal =>
            event.kind === 'goal' && isOvertimePeriod(setup, scenarioPeriod(event.time, setup)),
      )
      .toSorted((a, b) => a.time - b.time || events.indexOf(a) - events.indexOf(b))[0];
}

export const scenarioEnd = (events: ScenarioEvent[], setup: ScenarioSetup): GameElapsed =>
   overtimeWinner(events, setup)?.time ?? scenarioSeconds(setup);

export const isDiscarded = (event: ScenarioEvent, winner: ScenarioGoal | undefined): boolean =>
   winner !== undefined && event.time > winner.time;

export const penaltySeconds = (penaltyType: ScenarioPenaltyType): number =>
   SCENARIO_PENALTY_RULES[penaltyType].minutes * 60;

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

export const scenarioPlayerId = (penaltyId: number): number => 1000 + penaltyId;

const clockPad = (seconds: number): string => {
   const clock = secondsToClock(seconds);
   return clock.length < 5 ? `0${clock}` : clock;
};

const periodDescriptor = (setup: ScenarioSetup, period: number) => ({
   number: period,
   periodType: isOvertimePeriod(setup, period) ? PERIOD_TYPES.OVERTIME : PERIOD_TYPES.REGULATION,
   maxRegulationPeriods: setup.regulation,
});

const playClock = (setup: ScenarioSetup, time: GameElapsed, period: number) => {
   const inPeriod = time - periodStart(period);
   return {
      periodDescriptor: periodDescriptor(setup, period),
      timeInPeriod: clockPad(inPeriod),
      timeRemaining: clockPad(periodLength(setup, period) - inPeriod),
   };
};

const PERIOD_PLAY_ID = 900_000;
const PERIOD_FACEOFF_ID = 800_000;

// Builds a game from hand-placed events, so the real engine can run on it. Events at the same second keep the order
// they were added in. A faceoff opens every period and follows every stoppage: the engine resets 3-on-3 OT strength
// on faceoffs.
export function scenarioGame(events: ScenarioEvent[], setup: ScenarioSetup): Game {
   const end = scenarioEnd(events, setup);
   const lastPeriod = scenarioPeriod(end, setup);
   const homeId = SCENARIO_TEAM_IDS.home;

   const faceoff = (
      eventId: number,
      time: GameElapsed,
      period: number,
      sortOrder: number,
   ): Play => ({
      eventId,
      sortOrder,
      typeCode: 0,
      typeDescKey: PLAY_TYPES.FACEOFF,
      ...playClock(setup, time, period),
      details: { eventOwnerTeamId: homeId, winningPlayerId: 0, losingPlayerId: 0 },
   });

   const periodPlays = Array.from({ length: lastPeriod }, (_, i): Play[] => {
      const period = i + 1;
      const start = periodStart(period);
      const periodEnd = Math.min(end, start + periodLength(setup, period));
      const sortOrder = i * 3;
      return [
         {
            eventId: PERIOD_PLAY_ID + sortOrder,
            sortOrder,
            typeCode: 0,
            typeDescKey: PLAY_TYPES.PERIOD_START,
            ...playClock(setup, start, period),
         },
         faceoff(PERIOD_FACEOFF_ID + period, start, period, sortOrder + 1),
         {
            eventId: PERIOD_PLAY_ID + sortOrder + 2,
            sortOrder: sortOrder + 2,
            typeCode: 0,
            typeDescKey: PLAY_TYPES.PERIOD_END,
            ...playClock(setup, periodEnd, period),
         },
      ];
   }).flat();
   const gameEndOrder = lastPeriod * 3;
   const gameEnd: Play = {
      eventId: PERIOD_PLAY_ID + gameEndOrder,
      sortOrder: gameEndOrder,
      typeCode: 0,
      typeDescKey: PLAY_TYPES.GAME_END,
      ...playClock(setup, end, lastPeriod),
   };

   const winner = overtimeWinner(events, setup);
   const counted = eventsWithin(events, setup).filter((event) => !isDiscarded(event, winner));
   const ordered = counted
      .map((event, i) => ({ event, sortOrder: 100 + i }))
      .toSorted((a, b) => a.event.time - b.event.time || a.sortOrder - b.sortOrder);
   const score = { away: 0, home: 0 };
   const eventPlays = ordered.map(({ event, sortOrder }): Play => {
      const period = scenarioPeriod(event.time, setup);
      const base = {
         eventId: event.id,
         sortOrder,
         typeCode: 0,
         ...playClock(setup, event.time, period),
      };
      if (event.kind === 'stoppage') return faceoff(event.id, event.time, period, sortOrder);
      const teamId = SCENARIO_TEAM_IDS[event.side];
      if (event.kind === 'goal') {
         score[event.side] += 1;
         const goal: GoalPlay = {
            ...base,
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
         ...base,
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

   const rosterSpots: Player[] = counted
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
      gameType:
         setup.gameType === SCENARIO_GAME_TYPES.PLAYOFF
            ? GAME_TYPES.PLAYOFFS
            : GAME_TYPES.REGULAR_SEASON,
      gameDate: '2026-10-01',
      regPeriods: setup.regulation,
      awayTeam: SCENARIO_TEAMS.away,
      homeTeam: SCENARIO_TEAMS.home,
      plays: [...periodPlays, ...eventPlays, gameEnd],
      rosterSpots,
   };
}
