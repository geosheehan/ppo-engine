import '@views/WhatIfView/WhatIfView.css';
import { useMemo, useState } from 'react';
import GoalEffectTable from '@components/GoalEffectTable';
import PenaltyChart from '@components/PenaltyChart';
import ScenarioTrack from '@components/ScenarioTrack';
import StrengthRibbon from '@components/StrengthRibbon';
import StrengthTable from '@components/StrengthTable';
import { GameContext } from '@context/GameContext';
import type { GameContextValue } from '@context/types';
import { gameAxis } from '@layout/gameAxis';
import { homeDefendingSides } from '@engine/defendingSide';
import { runPenaltyEngine } from '@engine/penaltyEngine';
import { countPowerPlays, totalsAt } from '@engine/powerPlayCounter';
import { SIDES } from '@domain/constants';
import { indexGame } from '@domain/game';
import { periodLabel } from '@domain/labels';
import {
   SCENARIO_PENALTIES,
   SCENARIO_PENALTY_RULES,
   SCENARIO_PERIODS,
   SCENARIO_SECONDS,
   scenarioClock,
   scenarioGame,
   scenarioPeriod,
} from '@domain/scenario';
import type { ScenarioEvent, ScenarioGoal, ScenarioPenalty } from '@domain/scenario';
import type { GameElapsed, Side } from '@domain/types';

const SIDE_ORDER: Side[] = [SIDES.AWAY, SIDES.HOME];

type NewEvent = Omit<ScenarioPenalty, 'id' | 'time'> | Omit<ScenarioGoal, 'id' | 'time'>;

function scenarioContext(events: ScenarioEvent[]): GameContextValue {
   const game = scenarioGame(events);
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
   const [events, setEvents] = useState<ScenarioEvent[]>([]);
   const [selectedId, setSelectedId] = useState<number>();
   const [cursor, setCursor] = useState<GameElapsed>(0);

   const scenario = useMemo(() => scenarioContext(events), [events]);
   const axis = useMemo(() => gameAxis(scenario, scenario.penaltyResult.timeline), [scenario]);
   const totals = totalsAt(scenario.powerPlays, SCENARIO_SECONDS);
   const teams = {
      away: scenario.game.awayTeam.abbrev,
      home: scenario.game.homeTeam.abbrev,
   };
   const selected = events.find((event) => event.id === selectedId);

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

   return (
      <main className="what-if">
         <h1>What if?</h1>
         <p className="what-if__hint">
            Click the track to place the cursor, then add events there. Drag to move, and drag a
            penalty's right edge to change its type. Arrow keys nudge the selected event (Shift for
            a minute), and Delete removes it.
         </p>

         <div className="what-if__toolbar">
            <span className="what-if__cursor">
               At {periodLabel(scenarioPeriod(cursor), SCENARIO_PERIODS)} {scenarioClock(cursor)}
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

         <div className="what-if__builder">
            <ScenarioTrack
               events={events}
               selectedId={selectedId}
               cursor={cursor}
               teams={teams}
               colors={scenario.colors}
               onChange={change}
               onSelect={setSelectedId}
               onRemove={remove}
               onCursor={setCursor}
            />
         </div>

         <GameContext value={scenario}>
            <h2>What the engine sees</h2>
            <div className="what-if__strip">
               <div className="what-if__strip-content">
                  <PenaltyChart axis={axis} />
                  <StrengthRibbon axis={axis} />
               </div>
            </div>
            <div className="what-if__totals">
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
            </div>
            <GoalEffectTable />
         </GameContext>
      </main>
   );
}

export default WhatIfView;
