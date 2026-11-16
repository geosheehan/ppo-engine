import '@components/ScenarioTrack/ScenarioTrack.css';
import { Fragment, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { clsx } from 'clsx';
import ActionButton from '@components/ActionButton';
import { useElementWidth } from '@hooks/useElementWidth';
import {
   isPeriodStart,
   OVERTIME_FORMATS,
   penaltyLanes,
   tickSeconds,
   trackFraction,
   trackSeconds,
   trackTicks,
} from '@layout/scenarioTrack';
import { SIDES } from '@domain/constants';
import { periodLabel } from '@domain/labels';
import {
   isDiscarded,
   isOvertimePeriod,
   nearestPenaltyType,
   overtimeWinner,
   penaltySeconds,
   periodCount,
   SCENARIO_PENALTY_RULES,
   scenarioClock,
   scenarioPeriod,
   scenarioSeconds,
   snapTime,
} from '@domain/scenario';
import type { ScenarioEvent, ScenarioPenalty, ScenarioSetup } from '@domain/scenario';
import type { GameElapsed, Side } from '@domain/types';

const TEAM_ROWS: Side[] = [SIDES.HOME, SIDES.AWAY];
const KEY_STEP_SECONDS = 5;
const SHIFT_KEY_STEP_SECONDS = 60;
const DISCARDED_NOTE = 'Discarded: after the OT winner';
const CHIP_INSET_PX = 2;
const REASON_MS = 4000;
const MENU_ROOM_PX = 200;

type Drag = {
   id: number;
   mode: 'move' | 'stretch';
   startX: number;
   time: GameElapsed;
   seconds: number;
};

type Row = {
   key: string;
   label: string;
   kind: 'penalty' | 'events';
   side?: Side;
   content: ReactNode[];
};

export type PeriodOption = {
   key: string;
   label: string;
   length?: string;
   current: boolean;
   blocked?: string;
   onPick: () => void;
};

export type PeriodControls = {
   options: PeriodOption[];
   addBlocked?: string;
   removeBlocked?: string;
   onAdd: () => void;
   onRemove: () => void;
};

type ScenarioTrackProps = {
   events: ScenarioEvent[];
   setup: ScenarioSetup;
   selectedId: number | undefined;
   cursor: GameElapsed;
   teams: Record<Side, string>;
   colors: Record<Side, string>;
   onChange: (event: ScenarioEvent) => void;
   onSelect: (id: number | undefined) => void;
   onRemove: (id: number) => void;
   onCursor: (time: GameElapsed) => void;
   periodControls: (period: number) => PeriodControls;
};

const percent = (fraction: number): string => `${fraction * 100}%`;

function ScenarioTrack({
   events,
   setup,
   selectedId,
   cursor,
   teams,
   colors,
   onChange,
   onSelect,
   onRemove,
   onCursor,
   periodControls,
}: ScenarioTrackProps) {
   const dragRef = useRef<Drag | null>(null);
   const chipRefs = useRef(new Map<number, HTMLButtonElement>());
   const chipGroupRefs = useRef(new Map<number, HTMLDivElement>());
   const menuId = useId();
   const periods = periodCount(setup);
   const [openPeriod, setOpenPeriod] = useState<number>();
   const [focusedPeriod, setFocusedPeriod] = useState(1);
   const [reason, setReason] = useState<{ period: number; text: string }>();

   useEffect(() => {
      if (reason === undefined) return;
      const timer = setTimeout(() => setReason(undefined), REASON_MS);
      return () => clearTimeout(timer);
   }, [reason]);

   useEffect(() => {
      if (openPeriod === undefined) return;
      const closeOutside = (e: globalThis.PointerEvent) => {
         if (chipGroupRefs.current.get(openPeriod)?.contains(e.target as Node) !== true)
            setOpenPeriod(undefined);
      };
      document.addEventListener('pointerdown', closeOutside);
      return () => document.removeEventListener('pointerdown', closeOutside);
   }, [openPeriod]);

   const periodsRef = useRef(periods);
   useEffect(() => {
      if (periods === periodsRef.current) return;
      const removed = periods < periodsRef.current;
      periodsRef.current = periods;
      setOpenPeriod(undefined);
      setFocusedPeriod((period) => Math.min(period, periods));
      if (!removed || document.activeElement !== document.body) return;
      chipRefs.current.get(Math.min(focusedPeriod, periods))?.focus();
   }, [periods, focusedPeriod]);
   const [rulerRef, rulerWidth] = useElementWidth<HTMLDivElement>();
   const total = scenarioSeconds(setup);
   const ticks = trackTicks(total, tickSeconds(rulerWidth, total));
   const { laneOf, laneCount } = penaltyLanes(events);
   const winner = overtimeWinner(events, setup);
   const at = (time: GameElapsed): string => percent(trackFraction(time, total));
   const moment = (time: GameElapsed): string =>
      `${periodLabel(scenarioPeriod(time, setup), setup.regulation)} ${scenarioClock(time, setup)}`;

   const eventTitle = (event: ScenarioEvent): string => {
      const what =
         event.kind === 'stoppage'
            ? 'Stoppage'
            : event.kind === 'goal'
              ? `${teams[event.side]} goal`
              : `${teams[event.side]} #${event.id} ${SCENARIO_PENALTY_RULES[event.penaltyType].label.toLowerCase()}`;
      const title = `${what} · ${moment(event.time)}`;
      return isDiscarded(event, winner) ? `${title} · ${DISCARDED_NOTE}` : title;
   };

   const startDrag = (event: ScenarioEvent, mode: Drag['mode']) => (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
         id: event.id,
         mode,
         startX: e.clientX,
         time: event.time,
         seconds: event.kind === 'penalty' ? penaltySeconds(event.penaltyType) : 0,
      };
      onSelect(event.id);
   };

   const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || rulerWidth === 0) return;
      const event = events.find((candidate) => candidate.id === drag.id);
      if (!event) return;
      const delta = trackSeconds((e.clientX - drag.startX) / rulerWidth, total);
      if (drag.mode === 'move') {
         const time = snapTime(drag.time + delta, setup);
         if (time !== event.time) onChange({ ...event, time });
      } else if (event.kind === 'penalty') {
         const penaltyType = nearestPenaltyType(drag.seconds + delta);
         if (penaltyType !== event.penaltyType) onChange({ ...event, penaltyType });
      }
   };

   const endDrag = () => {
      dragRef.current = null;
   };

   const placeCursor = (e: PointerEvent<HTMLDivElement>) => {
      const box = e.currentTarget.getBoundingClientRect();
      onCursor(snapTime(trackSeconds((e.clientX - box.left) / box.width, total), setup));
      onSelect(undefined);
   };

   const onKeyDown = (event: ScenarioEvent) => (e: KeyboardEvent) => {
      const step = e.shiftKey ? SHIFT_KEY_STEP_SECONDS : KEY_STEP_SECONDS;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
         e.preventDefault();
         const time = snapTime(event.time + (e.key === 'ArrowLeft' ? -step : step), setup);
         onChange({ ...event, time });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
         e.preventDefault();
         onRemove(event.id);
      }
   };

   const markerClass = (event: ScenarioEvent, base: string) =>
      clsx(
         base,
         event.id === selectedId && 'scenario-track__marker--selected',
         isDiscarded(event, winner) && 'scenario-track__marker--discarded',
      );

   const markerProps = (event: ScenarioEvent) => ({
      'type': 'button' as const,
      'title': eventTitle(event),
      'aria-label': eventTitle(event),
      'aria-pressed': event.id === selectedId,
      'onPointerDown': startDrag(event, 'move'),
      'onFocus': () => onSelect(event.id),
      'onKeyDown': onKeyDown(event),
   });

   const penaltyBox = (penalty: ScenarioPenalty) => (
      <button
         key={penalty.id}
         {...markerProps(penalty)}
         className={markerClass(penalty, 'scenario-track__penalty')}
         style={{
            'left': at(penalty.time),
            'width': at(penaltySeconds(penalty.penaltyType)),
            '--team-color': colors[penalty.side],
         }}
      >
         #{penalty.id}
         <span
            className="scenario-track__stretch"
            aria-hidden="true"
            onPointerDown={startDrag(penalty, 'stretch')}
         />
      </button>
   );

   const pointMarker = (event: ScenarioEvent, base: string, color?: string) => (
      <button
         key={event.id}
         {...markerProps(event)}
         className={markerClass(event, base)}
         style={{ 'left': at(event.time), '--team-color': color }}
      />
   );

   const penaltyRows = (side: Side): Row[] =>
      Array.from({ length: laneCount[side] }, (_, lane): Row => ({
         key: `${side}-penalty-${lane}`,
         label: lane === 0 ? teams[side] : '',
         kind: 'penalty',
         side,
         content: events
            .filter(
               (event): event is ScenarioPenalty =>
                  event.kind === 'penalty' && event.side === side && laneOf.get(event.id) === lane,
            )
            .map(penaltyBox),
      }));

   const [firstSide, secondSide] = TEAM_ROWS;
   const rows: Row[] = [
      ...penaltyRows(firstSide),
      {
         key: 'events',
         label: 'Events',
         kind: 'events',
         content: events.flatMap((event) => {
            if (event.kind === 'goal')
               return [pointMarker(event, 'scenario-track__goal', colors[event.side])];
            if (event.kind === 'stoppage') return [pointMarker(event, 'scenario-track__stoppage')];
            return [];
         }),
      },
      ...penaltyRows(secondSide),
   ];

   const chipLabel = (period: number): string =>
      isOvertimePeriod(setup, period)
         ? `${periodLabel(period, setup.regulation)} · ${OVERTIME_FORMATS[setup.gameType].chip}`
         : periodLabel(period, setup.regulation);
   const onChipKeyDown = (period: number) => (e: KeyboardEvent) => {
      const target: Record<string, number> = {
         ArrowLeft: period - 1,
         ArrowRight: period + 1,
         Home: 1,
         End: periods,
      };
      const next = target[e.key];
      if (next === undefined) return;
      e.preventDefault();
      chipRefs.current.get(Math.min(Math.max(next, 1), periods))?.focus();
   };
   const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || openPeriod === undefined) return;
      e.preventDefault();
      chipRefs.current.get(openPeriod)?.focus();
      setOpenPeriod(undefined);
   };

   const periodChip = (period: number, time: GameElapsed) => {
      const name = periodLabel(period, setup.regulation);
      const controls = periodControls(period);
      const open = period === openPeriod;
      const room = (1 - trackFraction(time, total)) * rulerWidth - CHIP_INSET_PX;
      const explain = (text: string) => setReason({ period, text });
      return (
         <div
            key={time}
            ref={(group) => {
               if (group) chipGroupRefs.current.set(period, group);
               else chipGroupRefs.current.delete(period);
            }}
            role="group"
            aria-label={name}
            className={clsx('scenario-track__period', open && 'scenario-track__period--open')}
            style={{ 'left': at(time), '--scenario-track-chip-room': `${room}px` }}
            onKeyDown={closeOnEscape}
         >
            <button
               ref={(chip) => {
                  if (chip) chipRefs.current.set(period, chip);
                  else chipRefs.current.delete(period);
               }}
               type="button"
               className="scenario-track__period-name"
               aria-expanded={open}
               aria-controls={open ? `${menuId}-${period}` : undefined}
               title={`Change ${name}'s type`}
               tabIndex={period === focusedPeriod ? 0 : -1}
               onFocus={() => setFocusedPeriod(period)}
               onClick={() => setOpenPeriod(open ? undefined : period)}
               onKeyDown={onChipKeyDown(period)}
            >
               {chipLabel(period)}
               <span aria-hidden="true">{open ? ' ▴' : ' ▾'}</span>
            </button>
            <ActionButton
               label="+"
               name={`Add a period after ${name}`}
               hint={`Add a period after ${name}`}
               blocked={controls.addBlocked}
               onClick={controls.onAdd}
               onBlocked={explain}
            />
            <ActionButton
               label="−"
               name={`Remove ${name}`}
               hint={`Remove ${name}`}
               blocked={controls.removeBlocked}
               onClick={controls.onRemove}
               onBlocked={explain}
            />
            {open && (
               <div
                  id={`${menuId}-${period}`}
                  role="group"
                  aria-label={`${name} type`}
                  className={clsx(
                     'scenario-track__period-menu',
                     room < MENU_ROOM_PX && 'scenario-track__period-menu--end',
                  )}
               >
                  {controls.options.map((option, i) => (
                     <Fragment key={option.key}>
                        <button
                           type="button"
                           className="scenario-track__period-option"
                           aria-current={option.current || undefined}
                           aria-disabled={option.blocked !== undefined}
                           onClick={() => {
                              if (option.blocked !== undefined) return;
                              if (!option.current) option.onPick();
                              setOpenPeriod(undefined);
                              chipRefs.current.get(period)?.focus();
                           }}
                        >
                           {option.label}
                           {option.length !== undefined && <small> {option.length}</small>}
                        </button>
                        {option.blocked !== undefined
                           && controls.options[i + 1]?.blocked !== option.blocked && (
                              <span className="scenario-track__period-why">{option.blocked}</span>
                           )}
                     </Fragment>
                  ))}
               </div>
            )}
            {reason?.period === period && (
               <span role="status" className="scenario-track__reason">
                  {reason.text}
               </span>
            )}
         </div>
      );
   };

   return (
      <div
         className="scenario-track"
         style={{ gridTemplateRows: `1.75rem repeat(${rows.length}, 2rem)` }}
         onPointerMove={onPointerMove}
         onPointerUp={endDrag}
         onPointerCancel={endDrag}
      >
         <div ref={rulerRef} className="scenario-track__ruler">
            {ticks.map((time) =>
               isPeriodStart(time, total) ? (
                  periodChip(scenarioPeriod(time, setup), time)
               ) : (
                  <span key={time} className="scenario-track__tick" style={{ left: at(time) }}>
                     {scenarioClock(time, setup)}
                  </span>
               ),
            )}
         </div>
         <div className="scenario-track__guides" aria-hidden="true">
            {ticks.map((time) => (
               <span
                  key={time}
                  className={clsx(
                     'scenario-track__guide',
                     time > 0 && isPeriodStart(time, total) && 'scenario-track__guide--period',
                  )}
                  style={{ left: at(time) }}
               />
            ))}
            {winner && (
               <span
                  className="scenario-track__game-over"
                  style={{ left: at(winner.time) }}
                  title="Game over: the OT winner ends the game"
               />
            )}
            <span className="scenario-track__cursor" style={{ left: at(cursor) }} />
         </div>
         {rows.map((row, i) => (
            <Fragment key={row.key}>
               <span
                  className={clsx(
                     'scenario-track__label',
                     row.kind !== 'penalty' && 'scenario-track__label--minor',
                  )}
                  style={{ gridRow: i + 2 }}
               >
                  {row.label}
               </span>
               <div
                  className={clsx(
                     'scenario-track__lane',
                     row.side === SIDES.HOME && 'scenario-track__lane--home',
                  )}
                  style={{ gridRow: i + 2 }}
                  onPointerDown={placeCursor}
               >
                  {row.content}
               </div>
            </Fragment>
         ))}
      </div>
   );
}

export default ScenarioTrack;
