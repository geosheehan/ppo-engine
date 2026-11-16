import { describe, expect, it } from 'vitest';
import { DEFAULT_SETUP } from '@domain/scenario';
import type { ScenarioEvent, ScenarioSetup } from '@domain/scenario';
import {
   addOvertimeBlock,
   addPeriodAfter,
   addPeriodAfterBlock,
   addRegulationBlock,
   makeOvertime,
   makeOvertimeBlock,
   makeRegulation,
   makeRegulationBlock,
   removeBlock,
   removePeriod,
   setOvertimeFormat,
} from '@domain/scenarioPeriods';

const THREE_REG: ScenarioSetup = { gameType: 'regular', regulation: 3, overtime: 0 };
const OT_ONLY: ScenarioSetup = { gameType: 'regular', regulation: 0, overtime: 1 };
const PLAYOFF_2OT: ScenarioSetup = { gameType: 'playoff', regulation: 1, overtime: 2 };

const goal = (id: number, time: number): ScenarioEvent => ({
   id,
   kind: 'goal',
   side: 'home',
   time,
});
const times = (events: ScenarioEvent[]) => events.map(({ id, time }) => [id, time]);

describe('removePeriod', () => {
   const events = [goal(1, 600), goal(2, 1800), goal(3, 3000)];

   it('deletes the removed periods events and moves later periods back with theirs', () => {
      const edit = removePeriod({ setup: THREE_REG, events }, 2);
      expect(edit.setup).toMatchObject({ regulation: 2, overtime: 0 });
      expect(times(edit.events)).toEqual([
         [1, 600],
         [3, 1800],
      ]);
   });

   it('lets a penalty that ran into the removed period run into its new neighbor', () => {
      const penalty: ScenarioEvent = {
         id: 4,
         kind: 'penalty',
         side: 'away',
         time: 1140,
         penaltyType: 'major',
      };
      const edit = removePeriod({ setup: THREE_REG, events: [penalty] }, 2);
      expect(times(edit.events)).toEqual([[4, 1140]]);
   });

   it('removes an OT period as OT', () => {
      expect(removePeriod({ setup: PLAYOFF_2OT, events: [] }, 3).setup).toMatchObject({
         regulation: 1,
         overtime: 1,
      });
   });

   it('is blocked only for the last remaining period', () => {
      expect(removeBlock(DEFAULT_SETUP)).toBeDefined();
      expect(removeBlock(THREE_REG)).toBeUndefined();
   });
});

describe('addPeriodAfter', () => {
   it('adds a REG period right after a REG period, pushing later periods along with their events', () => {
      const edit = addPeriodAfter(
         { setup: { ...THREE_REG, regulation: 2 }, events: [goal(1, 1800)] },
         1,
      );
      expect(edit.setup.regulation).toBe(3);
      expect(times(edit.events)).toEqual([[1, 3000]]);
   });

   it('adds an OT period right after an OT period', () => {
      const edit = addPeriodAfter({ setup: PLAYOFF_2OT, events: [goal(1, 2500)] }, 2);
      expect(edit.setup).toMatchObject({ regulation: 1, overtime: 3 });
      expect(times(edit.events)).toEqual([[1, 3700]]);
   });

   it('leaves earlier periods events where they are', () => {
      const edit = addPeriodAfter({ setup: THREE_REG, events: [goal(1, 3000)] }, 3);
      expect(times(edit.events)).toEqual([[1, 3000]]);
   });

   it('adds OT after the last REG period once there are three REG periods', () => {
      const edit = addPeriodAfter({ setup: THREE_REG, events: [goal(1, 3000)] }, 3);
      expect(edit.setup).toMatchObject({ regulation: 3, overtime: 1 });
      expect(addPeriodAfterBlock(THREE_REG, 3)).toBeUndefined();
      expect(addPeriodAfterBlock({ ...THREE_REG, overtime: 1 }, 3)).toBe(
         '3-on-3 OT has only one period',
      );
   });

   it('inserts REG mid-game at the REG cap by pushing the last REG period into OT', () => {
      const events = [goal(1, 1320), goal(2, 2520), goal(3, 3000)];
      const edit = addPeriodAfter({ setup: THREE_REG, events }, 1);
      expect(edit.setup).toMatchObject({ regulation: 3, overtime: 1 });
      expect(times(edit.events)).toEqual([
         [1, 2520],
         [2, 3720],
      ]);
      expect(addPeriodAfterBlock(THREE_REG, 1)).toBeUndefined();
   });

   it('is blocked when the shifted periods would need an OT the game cant have', () => {
      expect(addPeriodAfterBlock({ ...THREE_REG, overtime: 1 }, 1)).toBe(
         '3-on-3 OT has only one period',
      );
      expect(addPeriodAfterBlock({ ...THREE_REG, gameType: 'playoff', overtime: 2 }, 2)).toBe(
         'At most 2 OT periods',
      );
   });

   it('is blocked by the cap for the periods own type', () => {
      expect(addPeriodAfterBlock(OT_ONLY, 1)).toBe('3-on-3 OT has only one period');
      expect(addPeriodAfterBlock({ ...OT_ONLY, gameType: 'playoff' }, 1)).toBeUndefined();
   });

   it('allows three REG periods, one 3-on-3 OT and two 5-on-5 OTs', () => {
      expect(addRegulationBlock(THREE_REG)).toBeDefined();
      expect(addRegulationBlock(OT_ONLY)).toBeUndefined();
      expect(addOvertimeBlock(OT_ONLY)).toBe('3-on-3 OT has only one period');
      expect(addOvertimeBlock({ ...OT_ONLY, gameType: 'playoff' })).toBeUndefined();
      expect(addOvertimeBlock(PLAYOFF_2OT)).toBeDefined();
   });
});

describe('changing a periods type', () => {
   it('lets only the last REG period become OT and only the first OT become REG', () => {
      expect(makeOvertimeBlock(THREE_REG, 3)).toBeUndefined();
      expect(makeOvertimeBlock(THREE_REG, 2)).toBe('Only the last REG period can become OT');
      expect(makeRegulationBlock(PLAYOFF_2OT, 2)).toBeUndefined();
      expect(makeRegulationBlock(PLAYOFF_2OT, 3)).toBe('Only the first OT period can become REG');
   });

   it('blocks a type change that would break a period cap', () => {
      expect(makeOvertimeBlock({ ...THREE_REG, overtime: 1 }, 3)).toBe(
         '3-on-3 OT has only one period',
      );
      expect(makeRegulationBlock({ ...THREE_REG, overtime: 1 }, 4)).toBeDefined();
   });

   it('trims a REG period to 5:00 when it becomes 3-on-3 OT', () => {
      const edit = makeOvertime({ setup: DEFAULT_SETUP, events: [goal(1, 200), goal(2, 600)] });
      expect(edit.setup).toEqual(OT_ONLY);
      expect(times(edit.events)).toEqual([[1, 200]]);
   });

   it('sets the games OT format when a REG period becomes OT', () => {
      const edit = makeOvertime({ setup: DEFAULT_SETUP, events: [goal(1, 600)] }, 'playoff');
      expect(edit.setup).toEqual({ gameType: 'playoff', regulation: 0, overtime: 1 });
      expect(times(edit.events)).toEqual([[1, 600]]);
   });

   it('turns an OT-only game back into REG', () => {
      expect(makeRegulation({ setup: OT_ONLY, events: [] }).setup).toEqual(DEFAULT_SETUP);
   });
});

describe('setOvertimeFormat', () => {
   it('keeps only the first OT, trimmed to 5:00, when switching to 3-on-3', () => {
      const events = [goal(1, 1440), goal(2, 2000), goal(3, 2500)];
      const edit = setOvertimeFormat({ setup: PLAYOFF_2OT, events }, 'regular');
      expect(edit.setup).toMatchObject({ gameType: 'regular', overtime: 1 });
      expect(times(edit.events)).toEqual([[1, 1440]]);
   });
});
