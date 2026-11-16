import '@views/WhatIfView/WhatIfView.css';
import { useMemo, useState } from 'react';
import GoalEffectTable from '@components/GoalEffectTable';
import PenaltyChart from '@components/PenaltyChart';
import ScenarioTrack from '@components/ScenarioTrack';
import type { PeriodControls, PeriodOption } from '@components/ScenarioTrack/ScenarioTrack';
import StrengthTable from '@components/StrengthTable';
import StrengthTableMerged from '@components/StrengthTable/StrengthTableMerged';
import { GameContext } from '@context/GameContext';
import type { GameContextValue } from '@context/types';
import { SEPARATOR } from '@layout/constants';
import { gameAxis } from '@layout/gameAxis';
import { OVERTIME_FORMATS } from '@layout/scenarioTrack';
import { homeDefendingSides } from '@engine/defendingSide';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { countPowerPlays, totalsAt } from '@engine/powerPlayCounter';
import { SIDES } from '@domain/constants';
import { indexGame } from '@domain/game';
import { periodLabel } from '@domain/labels';
import {
   DEFAULT_SETUP,
   isDiscarded,
   isOvertimePeriod,
   lastEventTime,
   overtimeWinner,
   SCENARIO_GAME_TYPES,
   SCENARIO_PENALTIES,
   SCENARIO_PENALTY_RULES,
   scenarioClock,
   scenarioEnd,
   scenarioGame,
   scenarioPeriod,
} from '@domain/scenario';
import type {
   ScenarioEvent,
   ScenarioGoal,
   ScenarioPenalty,
   ScenarioSetup,
   ScenarioStoppage,
} from '@domain/scenario';
import {
   addPeriodAfter,
   addPeriodAfterBlock,
   makeOvertime,
   makeOvertimeBlock,
   makeRegulation,
   makeRegulationBlock,
   removeBlock,
   removePeriod,
   setOvertimeFormat,
} from '@domain/scenarioPeriods';
import type { ScenarioState } from '@domain/scenarioPeriods';
import type { GameElapsed, Side } from '@domain/types';

const SIDE_ORDER: Side[] = [SIDES.HOME, SIDES.AWAY];

type NewEvent =
   | Omit<ScenarioPenalty, 'id' | 'time'>
   | Omit<ScenarioGoal, 'id' | 'time'>
   | Omit<ScenarioStoppage, 'id' | 'time'>;

function scenarioContext(events: ScenarioEvent[], setup: ScenarioSetup): GameContextValue {
   const game = scenarioGame(events, setup);
   const index = indexGame(game);
   const penaltyResult = runPenaltyEngine(index);
   return {
      ...index,
      penaltyResult,
      powerPlays: countPowerPlays(penaltyResult.timeline),
      defendingSides: homeDefendingSides(game),
   };
}

function WhatIfView() {
   const [setup, setSetup] = useState<ScenarioSetup>(DEFAULT_SETUP);
   const [events, setEvents] = useState<ScenarioEvent[]>([]);
   const [selectedId, setSelectedId] = useState<number>();
   const [cursor, setCursor] = useState<GameElapsed>(0);

   const scenario = useMemo(() => scenarioContext(events, setup), [events, setup]);
   const axis = useMemo(() => gameAxis(scenario, scenario.penaltyResult.timeline), [scenario]);
   const totals = totalsAt(scenario.powerPlays, scenarioEnd(events, setup));
   const winner = overtimeWinner(events, setup);
   const stoppages = events
      .filter((event) => event.kind === 'stoppage' && !isDiscarded(event, winner))
      .map(({ time }) => time);
   const teams = {
      away: scenario.game.awayTeam.abbrev,
      home: scenario.game.homeTeam.abbrev,
   };
   const selected = events.find((event) => event.id === selectedId);
   const label = (period: number): string => periodLabel(period, setup.regulation);

   const add = (event: NewEvent) => {
      const id = Math.max(0, ...events.map((existing) => existing.id)) + 1;
      setEvents([...events, { ...event, id, time: cursor }]);
      setSelectedId(id);
   };
   const change = (changed: ScenarioEvent) =>
      setEvents(events.map((event) => (event.id === changed.id ? changed : event)));
   const remove = (id: number) => {
      setEvents(events.filter((event) => event.id !== id));
      setSelectedId(undefined);
   };
   const clear = () => {
      setEvents([]);
      setSelectedId(undefined);
   };
   const apply = (edit: ScenarioState) => {
      setSetup(edit.setup);
      setEvents(edit.events);
      setCursor(Math.min(cursor, lastEventTime(edit.setup)));
      if (!edit.events.some((event) => event.id === selectedId)) setSelectedId(undefined);
   };
   const state = { setup, events };

   const periodControls = (period: number): PeriodControls => {
      const overtime = isOvertimePeriod(setup, period);
      const regulation: PeriodOption = {
         key: 'regulation',
         label: 'REG',
         current: !overtime,
         blocked: overtime ? makeRegulationBlock(setup, period) : undefined,
         onPick: () => apply(makeRegulation(state)),
      };
      const formats = Object.values(SCENARIO_GAME_TYPES).map((gameType): PeriodOption => ({
         key: gameType,
         label: `OT ${SEPARATOR} ${OVERTIME_FORMATS[gameType].chip}`,
         length: OVERTIME_FORMATS[gameType].length,
         current: overtime && setup.gameType === gameType,
         blocked: overtime ? undefined : makeOvertimeBlock({ ...setup, gameType }, period),
         onPick: () =>
            apply(overtime ? setOvertimeFormat(state, gameType) : makeOvertime(state, gameType)),
      }));
      return {
         options: [regulation, ...formats],
         addBlocked: addPeriodAfterBlock(setup, period),
         removeBlocked: removeBlock(setup),
         onAdd: () => apply(addPeriodAfter(state, period)),
         onRemove: () => apply(removePeriod(state, period)),
      };
   };

   return (
      <main className="what-if">
         <title>What if?</title>
         <h1 className="visually-hidden">What if?</h1>

         <GameContext value={scenario}>
            <div className="what-if__top">
               {SIDE_ORDER.map((side, i) => (
                  <StrengthTable
                     key={side}
                     side={side}
                     position={i === 0 ? 'left' : 'right'}
                     team={scenario.teamByHomeOrAway(side)}
                     color={scenario.colors[side]}
                     totals={totals[side]}
                  />
               ))}
               <StrengthTableMerged
                  teams={SIDE_ORDER.map((side) => ({
                     side,
                     team: scenario.teamByHomeOrAway(side),
                     color: scenario.colors[side],
                     totals: totals[side],
                  }))}
               />

               <div className="what-if__controls">
                  <span className="what-if__cursor">
                     At {label(scenarioPeriod(cursor, setup))} {scenarioClock(cursor, setup)}
                  </span>
                  {SIDE_ORDER.map((side) => (
                     <div
                        key={side}
                        role="group"
                        aria-label={`Add for ${teams[side]}`}
                        className="what-if__add"
                        style={{ '--team-color': scenario.colors[side] }}
                     >
                        <span className="what-if__team">{teams[side]}</span>
                        {Object.values(SCENARIO_PENALTIES).map((penaltyType) => (
                           <button
                              key={penaltyType}
                              type="button"
                              onClick={() => add({ kind: 'penalty', side, penaltyType })}
                           >
                              + {SCENARIO_PENALTY_RULES[penaltyType].label}
                           </button>
                        ))}
                        <button type="button" onClick={() => add({ kind: 'goal', side })}>
                           + Goal
                        </button>
                     </div>
                  ))}
                  <div className="what-if__actions">
                     <button type="button" onClick={() => add({ kind: 'stoppage' })}>
                        + Stoppage
                     </button>
                     <button
                        type="button"
                        disabled={selected === undefined}
                        onClick={() => selected && remove(selected.id)}
                     >
                        Remove selected
                     </button>
                     <button type="button" disabled={events.length === 0} onClick={clear}>
                        Clear
                     </button>
                  </div>
               </div>
            </div>

            <ScenarioTrack
               events={events}
               setup={setup}
               selectedId={selectedId}
               cursor={cursor}
               teams={teams}
               colors={scenario.colors}
               onChange={change}
               onSelect={setSelectedId}
               onRemove={remove}
               onCursor={setCursor}
               periodControls={periodControls}
            />

            <h2>What the engine sees</h2>
            <PenaltyChart axis={axis} stoppages={stoppages} />
            <GoalEffectTable />
         </GameContext>
      </main>
   );
}

export default WhatIfView;
