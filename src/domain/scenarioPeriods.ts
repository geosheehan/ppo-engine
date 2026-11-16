import { PERIOD_SECONDS } from '@domain/constants';
import {
   eventsWithin,
   isOvertimePeriod,
   MAX_OVERTIME_PERIODS,
   MAX_REGULATION_PERIODS,
   periodCount,
   SCENARIO_GAME_TYPES,
} from '@domain/scenario';
import type { ScenarioEvent, ScenarioGameType, ScenarioSetup } from '@domain/scenario';

export type ScenarioState = {
   setup: ScenarioSetup;
   events: ScenarioEvent[];
};

const periodOf = (event: ScenarioEvent): number => Math.floor(event.time / PERIOD_SECONDS) + 1;

const shiftFrom = (events: ScenarioEvent[], from: number, by: number): ScenarioEvent[] =>
   events.map((event) =>
      periodOf(event) >= from ? { ...event, time: event.time + by * PERIOD_SECONDS } : event,
   );

export const addRegulationBlock = (setup: ScenarioSetup): string | undefined =>
   setup.regulation >= MAX_REGULATION_PERIODS
      ? `A game has at most ${MAX_REGULATION_PERIODS} REG periods`
      : undefined;

export const addOvertimeBlock = (setup: ScenarioSetup): string | undefined => {
   if (setup.overtime < MAX_OVERTIME_PERIODS[setup.gameType]) return undefined;
   return setup.gameType === SCENARIO_GAME_TYPES.REGULAR
      ? '3-on-3 OT has only one period'
      : `At most ${MAX_OVERTIME_PERIODS[setup.gameType]} OT periods`;
};

export const removeBlock = (setup: ScenarioSetup): string | undefined =>
   periodCount(setup) === 1 ? 'A game needs at least one period' : undefined;

export const makeOvertimeBlock = (setup: ScenarioSetup, period: number): string | undefined =>
   period === setup.regulation ? addOvertimeBlock(setup) : 'Only the last REG period can become OT';

export const makeRegulationBlock = (setup: ScenarioSetup, period: number): string | undefined =>
   period === setup.regulation + 1
      ? addRegulationBlock(setup)
      : 'Only the first OT period can become REG';

const addsOvertime = (setup: ScenarioSetup, after: number): boolean =>
   isOvertimePeriod(setup, after) || addRegulationBlock(setup) !== undefined;

export function addPeriodAfter({ setup, events }: ScenarioState, after: number): ScenarioState {
   const next = addsOvertime(setup, after)
      ? { ...setup, overtime: setup.overtime + 1 }
      : { ...setup, regulation: setup.regulation + 1 };
   return { setup: next, events: eventsWithin(shiftFrom(events, after + 1, 1), next) };
}

export const addPeriodAfterBlock = (setup: ScenarioSetup, after: number): string | undefined =>
   addsOvertime(setup, after) ? addOvertimeBlock(setup) : addRegulationBlock(setup);

export function removePeriod({ setup, events }: ScenarioState, period: number): ScenarioState {
   const next = isOvertimePeriod(setup, period)
      ? { ...setup, overtime: setup.overtime - 1 }
      : { ...setup, regulation: setup.regulation - 1 };
   const kept = events.filter((event) => periodOf(event) !== period);
   return {
      setup: next,
      events: eventsWithin(shiftFrom(kept, period + 1, -1), next),
   };
}

export function makeOvertime(
   { setup, events }: ScenarioState,
   gameType: ScenarioGameType = setup.gameType,
): ScenarioState {
   const next = {
      ...setup,
      gameType,
      regulation: setup.regulation - 1,
      overtime: setup.overtime + 1,
   };
   return { setup: next, events: eventsWithin(events, next) };
}

export function makeRegulation({ setup, events }: ScenarioState): ScenarioState {
   const next = { ...setup, regulation: setup.regulation + 1, overtime: setup.overtime - 1 };
   return { setup: next, events: eventsWithin(events, next) };
}

export function setOvertimeFormat(
   { setup, events }: ScenarioState,
   gameType: ScenarioGameType,
): ScenarioState {
   const next = {
      ...setup,
      gameType,
      overtime: Math.min(setup.overtime, MAX_OVERTIME_PERIODS[gameType]),
   };
   return { setup: next, events: eventsWithin(events, next) };
}
