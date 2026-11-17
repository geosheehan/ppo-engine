import '@components/EventInspector/EventInspector.css';
import type { KeyboardEvent } from 'react';
import ActionButton from '@components/ActionButton';
import ClockField from '@components/ClockField';
import ChevronIcon from '@components/icons/ChevronIcon';
import CopyIcon from '@components/icons/CopyIcon';
import CursorMoveIcon from '@components/icons/CursorMoveIcon';
import MinusIcon from '@components/icons/MinusIcon';
import PlusIcon from '@components/icons/PlusIcon';
import TrashIcon from '@components/icons/TrashIcon';
import { textColorOn } from '@domain/colors';
import { SIDES } from '@domain/constants';
import { periodLabel } from '@domain/labels';
import {
   clockSeconds,
   lastEventTime,
   periodCount,
   periodTime,
   SCENARIO_PENALTIES,
   SCENARIO_PENALTY_RULES,
   SCENARIO_SNAP_SECONDS,
   scenarioEventName,
   scenarioPeriod,
   snapTime,
} from '@domain/scenario';
import type { ScenarioEvent, ScenarioPenaltyType, ScenarioSetup } from '@domain/scenario';
import type { GameElapsed, Side } from '@domain/types';

const TEAM_ORDER: Side[] = [SIDES.HOME, SIDES.AWAY];
const ICON_SIZE = '1.15em';
const TEAM_KEYS: Record<string, Side> = { h: SIDES.HOME, a: SIDES.AWAY };
const TYPE_KEYS: Record<string, ScenarioPenaltyType> = {
   1: SCENARIO_PENALTIES.MINOR,
   2: SCENARIO_PENALTIES.DOUBLE_MINOR,
   3: SCENARIO_PENALTIES.MAJOR,
};

type EventInspectorProps = {
   event: ScenarioEvent;
   setup: ScenarioSetup;
   teams: Record<Side, string>;
   colors: Record<Side, string>;
   tag?: string;
   cursor: GameElapsed;
   previousId?: number;
   nextId?: number;
   onChange: (event: ScenarioEvent) => void;
   onRemove: (id: number) => void;
   onDuplicate: (event: ScenarioEvent) => void;
   onSelect: (id: number | undefined) => void;
   onCursor: (time: GameElapsed) => void;
};

function EventInspector({
   event,
   setup,
   teams,
   colors,
   tag,
   cursor,
   previousId,
   nextId,
   onChange,
   onRemove,
   onDuplicate,
   onSelect,
   onCursor,
}: EventInspectorProps) {
   const name = scenarioEventName(event, teams);
   const period = scenarioPeriod(event.time, setup);
   const periods = Array.from({ length: periodCount(setup) }, (_, i) => i + 1);
   const setTime = (time: GameElapsed) => onChange({ ...event, time });
   const nudge = (by: number) => setTime(snapTime(event.time + by, setup));
   const atCursor = event.time === cursor;
   const boxColor = event.kind === 'stoppage' ? undefined : colors[event.side];

   const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const key = e.key.toLowerCase();
      if (key === 'escape') onSelect(undefined);
      else if (event.kind !== 'stoppage' && key in TEAM_KEYS)
         onChange({ ...event, side: TEAM_KEYS[key] });
      else if (event.kind === 'penalty' && key in TYPE_KEYS)
         onChange({ ...event, penaltyType: TYPE_KEYS[key] });
      else return;
      e.preventDefault();
   };

   return (
      <div
         role="group"
         aria-label={`Edit ${name}`}
         className="event-inspector"
         style={{ '--team-color': event.kind === 'stoppage' ? undefined : colors[event.side] }}
         onKeyDown={onKeyDown}
      >
         <span className="event-inspector__field">
            <ActionButton
               label={<ChevronIcon direction="left" size={ICON_SIZE} />}
               name="Previous event"
               hint="Previous event"
               blocked={previousId === undefined ? 'No earlier event' : undefined}
               onClick={() => onSelect(previousId)}
            />
            <span className="event-inspector__name">
               {name}
               {tag !== undefined && <span className="event-inspector__tag">{tag}</span>}
            </span>
            <ActionButton
               label={<ChevronIcon direction="right" size={ICON_SIZE} />}
               name="Next event"
               hint="Next event"
               blocked={nextId === undefined ? 'No later event' : undefined}
               onClick={() => onSelect(nextId)}
            />
         </span>

         {event.kind !== 'stoppage' && (
            <span className="event-inspector__field">
               <span className="event-inspector__label">Team</span>
               <span role="group" aria-label="Team" className="event-inspector__teams">
                  {TEAM_ORDER.map((side) => (
                     <button
                        key={side}
                        type="button"
                        aria-pressed={side === event.side}
                        style={{
                           '--team-color': colors[side],
                           '--team-text-color': textColorOn(colors[side]),
                        }}
                        onClick={() => onChange({ ...event, side })}
                     >
                        {teams[side]}
                     </button>
                  ))}
               </span>
            </span>
         )}

         <span className="event-inspector__field">
            <span className="event-inspector__label">When</span>
            <select
               aria-label="Period"
               value={period}
               onChange={(e) =>
                  setTime(
                     periodTime(setup, Number(e.target.value), clockSeconds(event.time, setup)),
                  )
               }
            >
               {periods.map((option) => (
                  <option key={option} value={option}>
                     {periodLabel(option, setup.regulation)}
                  </option>
               ))}
            </select>
            <span className="event-inspector__combo">
               <ActionButton
                  label={<MinusIcon size={ICON_SIZE} />}
                  name={`${SCENARIO_SNAP_SECONDS} seconds earlier`}
                  hint={`${SCENARIO_SNAP_SECONDS} seconds earlier`}
                  blocked={event.time === 0 ? 'Already at the start of the game' : undefined}
                  repeat
                  onClick={() => nudge(-SCENARIO_SNAP_SECONDS)}
               />
               <ClockField
                  key={event.id}
                  time={event.time}
                  setup={setup}
                  label={`Clock in ${periodLabel(period, setup.regulation)}`}
                  onTime={setTime}
               />
               <ActionButton
                  label={<PlusIcon size={ICON_SIZE} />}
                  name={`${SCENARIO_SNAP_SECONDS} seconds later`}
                  hint={`${SCENARIO_SNAP_SECONDS} seconds later`}
                  blocked={
                     event.time >= lastEventTime(setup)
                        ? 'Already at the end of the game'
                        : undefined
                  }
                  repeat
                  onClick={() => nudge(SCENARIO_SNAP_SECONDS)}
               />
            </span>
         </span>

         {event.kind === 'penalty' && (
            <span className="event-inspector__field">
               <span className="event-inspector__label">Type</span>
               <span role="group" aria-label="Type" className="event-inspector__segments">
                  {Object.values(SCENARIO_PENALTIES).map((penaltyType) => (
                     <button
                        key={penaltyType}
                        type="button"
                        aria-pressed={penaltyType === event.penaltyType}
                        onClick={() => onChange({ ...event, penaltyType })}
                     >
                        {SCENARIO_PENALTY_RULES[penaltyType].label}
                     </button>
                  ))}
               </span>
            </span>
         )}

         <span className="event-inspector__field event-inspector__actions">
            <ActionButton
               label={<CursorMoveIcon moves="event" boxColor={boxColor} size={ICON_SIZE} />}
               name="Move to cursor"
               hint="Move to cursor"
               blocked={atCursor ? 'Already at the cursor' : undefined}
               onClick={() => setTime(cursor)}
            />
            <ActionButton
               label={<CursorMoveIcon moves="cursor" boxColor={boxColor} size={ICON_SIZE} />}
               name="Cursor to event"
               hint="Cursor to event"
               blocked={atCursor ? 'The cursor is already here' : undefined}
               onClick={() => onCursor(event.time)}
            />
            <ActionButton
               label={<CopyIcon size={ICON_SIZE} />}
               name="Duplicate"
               hint="Duplicate"
               onClick={() => onDuplicate(event)}
            />
            <ActionButton
               label={<TrashIcon size={ICON_SIZE} />}
               name="Delete"
               hint="Delete"
               onClick={() => onRemove(event.id)}
            />
         </span>
      </div>
   );
}

export default EventInspector;
