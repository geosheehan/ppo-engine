import '@views/WhatIfView/WhatIfView.css';
import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import EventInspector from '@components/EventInspector';
import GoalEffectTable from '@components/GoalEffectTable';
import PenaltyChart from '@components/PenaltyChart';
import PenaltyClocks from '@components/PenaltyClocks';
import ScenarioTrack from '@components/ScenarioTrack';
import type { PeriodControls, PeriodOption } from '@components/ScenarioTrack/ScenarioTrack';
import SegmentedControl from '@components/SegmentedControl';
import StrengthTable from '@components/StrengthTable';
import StrengthTableMerged from '@components/StrengthTable/StrengthTableMerged';
import WhyTable from '@components/WhyTable';
import { GameContext } from '@context/GameContext';
import type { GameContextValue } from '@context/types';
import {
   ALL_PLAYERS_USED,
   EVEN_STRENGTH_LABEL,
   GOAL_SITUATION_LABELS,
   SEPARATOR,
} from '@layout/constants';
import { gameAxis } from '@layout/gameAxis';
import { linkedEvents } from '@layout/linkedEvents';
import { OVERTIME_FORMATS } from '@layout/scenarioTrack';
import { whyNotes } from '@layout/whyNotes';
import { homeDefendingSides } from '@engine/defendingSide';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { countPowerPlays, goalSituation, totalsAt } from '@engine/powerPlayCounter';
import { snapshotAt } from '@engine/snapshot';
import { strengthLabel } from '@engine/strength';
import type { GoalEffect } from '@engine/types';
import { SIDES } from '@domain/constants';
import { indexGame } from '@domain/game';
import { periodLabel } from '@domain/labels';
import {
   DEFAULT_SETUP,
   eventsInOrder,
   isDiscarded,
   isOvertimePeriod,
   lastEventTime,
   nextPlayer,
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

const TABLE_VIEWS = {
   CURSOR: 'cursor',
   GAME: 'game',
} as const;

type TableView = (typeof TABLE_VIEWS)[keyof typeof TABLE_VIEWS];

const WHY_VIEWS = {
   OFF: 'off',
   ON: 'on',
} as const;

type WhyView = (typeof WHY_VIEWS)[keyof typeof WHY_VIEWS];

const WHY_OPTIONS = [
   { value: WHY_VIEWS.OFF, label: 'Off' },
   { value: WHY_VIEWS.ON, label: 'On' },
];

const TABLE_VIEW_LABELS: Record<TableView, string> = {
   [TABLE_VIEWS.CURSOR]: 'At cursor',
   [TABLE_VIEWS.GAME]: 'Full game',
};

type NewEvent =
   | Omit<ScenarioPenalty, 'id' | 'time'>
   | Omit<ScenarioGoal, 'id' | 'time'>
   | Omit<ScenarioStoppage, 'id' | 'time'>;

function goalStrengthTag(goal: GoalEffect): string {
   const situation = goalSituation(goal);
   const name = situation ? GOAL_SITUATION_LABELS[situation] : EVEN_STRENGTH_LABEL;
   return `${name} ${strengthLabel(goal.strength, goal.side)}`;
}

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
   const [hoveredId, setHoveredId] = useState<number>();
   const [cursor, setCursor] = useState<GameElapsed>(0);
   const [tableView, setTableView] = useState<TableView>(TABLE_VIEWS.CURSOR);
   const [whyView, setWhyView] = useState<WhyView>(WHY_VIEWS.OFF);
   const fullGame = tableView === TABLE_VIEWS.GAME;

   const scenario = useMemo(() => scenarioContext(events, setup), [events, setup]);
   const axis = useMemo(() => gameAxis(scenario, scenario.penaltyResult.timeline), [scenario]);
   const penaltyPlays = useMemo(
      () => new Map(scenario.penalties.map((play) => [play.eventId, play])),
      [scenario],
   );
   const engineDiscardedIds = useMemo(
      () =>
         new Set(
            scenario.penaltyResult.discardedPenalties
               .filter(({ reason }) => reason === 'notMinorToPlayerInBox')
               .map(({ penaltyEventId }) => penaltyEventId),
         ),
      [scenario],
   );
   const notes = useMemo(
      () =>
         whyNotes({
            result: scenario.penaltyResult,
            plays: scenario.plays,
            penalties: scenario.penalties,
            regPeriods: scenario.game.regPeriods,
            abbrevs: { away: scenario.game.awayTeam.abbrev, home: scenario.game.homeTeam.abbrev },
            gameEnd: axis.breakpoints.at(-1) ?? 0,
            sweaterNumberOf: ({ details }) =>
               details.committedByPlayerId !== undefined
                  ? scenario.playerById(details.committedByPlayerId)?.sweaterNumber
                  : undefined,
         }),
      [scenario, axis],
   );
   const snapshot = snapshotAt(scenario.penaltyResult, penaltyPlays, cursor);
   const totals = totalsAt(scenario.powerPlays, fullGame ? scenarioEnd(events, setup) : cursor);
   const strength = fullGame ? undefined : snapshot.strength;
   const winner = overtimeWinner(events, setup);
   const stoppages = events
      .filter((event) => event.kind === 'stoppage' && !isDiscarded(event, winner))
      .map(({ id, time }) => ({ eventId: id, time }));
   const teams = {
      away: scenario.game.awayTeam.abbrev,
      home: scenario.game.homeTeam.abbrev,
   };
   const selectedIds = linkedEvents(scenario.penaltyResult.goals, selectedId);
   const hoveredIds = linkedEvents(scenario.penaltyResult.goals, hoveredId);
   const selected = events.find((event) => event.id === selectedId);
   const ordered = eventsInOrder(events);
   const selectedAt = ordered.findIndex((event) => event.id === selectedId);
   const goalEffect = scenario.penaltyResult.goals.find((goal) => goal.goalEventId === selectedId);
   const goalTag = goalEffect && goalStrengthTag(goalEffect);
   const newPlayers: Record<Side, number | undefined> = {
      away: nextPlayer(events, SIDES.AWAY),
      home: nextPlayer(events, SIDES.HOME),
   };
   const label = (period: number): string => periodLabel(period, setup.regulation);

   const add = (event: NewEvent, time: GameElapsed = cursor) => {
      const id = Math.max(0, ...events.map((existing) => existing.id)) + 1;
      setEvents([...events, { ...event, id, time }]);
      setSelectedId(id);
   };
   const duplicate = ({ id: _id, time, ...event }: ScenarioEvent) => add(event, time);
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
            <div className={clsx('what-if__top', fullGame && 'what-if__top--full-game')}>
               {SIDE_ORDER.map((side, i) => (
                  <StrengthTable
                     key={side}
                     side={side}
                     position={i === 0 ? 'left' : 'right'}
                     team={scenario.teamByHomeOrAway(side)}
                     color={scenario.colors[side]}
                     totals={totals[side]}
                     strength={strength}
                  />
               ))}
               {!fullGame
                  && SIDE_ORDER.map((side, i) => (
                     <PenaltyClocks
                        key={side}
                        side={side}
                        onClock={snapshot.onClock}
                        position={i === 0 ? 'left' : 'right'}
                     />
                  ))}
               <StrengthTableMerged
                  teams={SIDE_ORDER.map((side) => ({
                     side,
                     team: scenario.teamByHomeOrAway(side),
                     color: scenario.colors[side],
                     totals: totals[side],
                  }))}
                  strength={strength}
               />

               <div className="what-if__controls">
                  <div className="what-if__view">
                     <SegmentedControl
                        label="Tables show"
                        value={tableView}
                        options={Object.values(TABLE_VIEWS).map((view) => ({
                           value: view,
                           label: TABLE_VIEW_LABELS[view],
                        }))}
                        onChange={setTableView}
                     />
                     <span className="what-if__cursor">
                        {!fullGame
                           && `At ${label(scenarioPeriod(cursor, setup))} ${scenarioClock(cursor, setup)}`}
                     </span>
                  </div>
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
                              disabled={newPlayers[side] === undefined}
                              title={newPlayers[side] === undefined ? ALL_PLAYERS_USED : undefined}
                              onClick={() => {
                                 const player = newPlayers[side];
                                 if (player !== undefined)
                                    add({ kind: 'penalty', side, penaltyType, player });
                              }}
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
               selectedIds={selectedIds}
               hoveredIds={hoveredIds}
               engineDiscardedIds={engineDiscardedIds}
               cursor={cursor}
               teams={teams}
               colors={scenario.colors}
               onChange={change}
               onSelect={setSelectedId}
               onHover={setHoveredId}
               onRemove={remove}
               onCursor={setCursor}
               periodControls={periodControls}
            />
            <div className="what-if__inspector">
               {selected && (
                  <EventInspector
                     event={selected}
                     events={events}
                     setup={setup}
                     teams={teams}
                     colors={scenario.colors}
                     tag={goalTag}
                     cursor={cursor}
                     previousId={ordered[selectedAt - 1]?.id}
                     nextId={ordered[selectedAt + 1]?.id}
                     onChange={change}
                     onRemove={remove}
                     onDuplicate={duplicate}
                     onSelect={setSelectedId}
                     onCursor={setCursor}
                  />
               )}
            </div>

            <div className="what-if__chart-head">
               <h2>What the engine sees</h2>
               <span className="what-if__why">
                  Why
                  <SegmentedControl
                     label="Why table"
                     value={whyView}
                     options={WHY_OPTIONS}
                     onChange={setWhyView}
                  />
               </span>
            </div>
            <PenaltyChart
               axis={axis}
               stoppages={stoppages}
               pieceNotes={notes.pieces}
               goalNotes={notes.goals}
               selectedIds={selectedIds}
               hoveredIds={hoveredIds}
               onSelect={setSelectedId}
               onHover={setHoveredId}
            />
            {whyView === WHY_VIEWS.ON && (
               <WhyTable
                  rows={notes.rows}
                  selectedIds={selectedIds}
                  hoveredIds={hoveredIds}
                  onSelect={setSelectedId}
                  onHover={setHoveredId}
               />
            )}
            <GoalEffectTable
               selectedIds={selectedIds}
               hoveredIds={hoveredIds}
               onSelect={setSelectedId}
               onHover={setHoveredId}
            />
         </GameContext>
      </main>
   );
}

export default WhatIfView;
