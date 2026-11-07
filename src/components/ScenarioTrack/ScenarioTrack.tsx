import '@components/ScenarioTrack/ScenarioTrack.css';
import { Fragment, useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { clsx } from 'clsx';
import {
   isPeriodBreak,
   penaltyLanes,
   trackFraction,
   trackSeconds,
   trackTicks,
} from '@layout/scenarioTrack';
import { SIDES } from '@domain/constants';
import { periodLabel } from '@domain/labels';
import {
   nearestPenaltyType,
   penaltySeconds,
   SCENARIO_PENALTY_RULES,
   SCENARIO_PERIODS,
   scenarioClock,
   scenarioPeriod,
   snapTime,
} from '@domain/scenario';
import type { ScenarioEvent, ScenarioPenalty } from '@domain/scenario';
import type { GameElapsed, Side } from '@domain/types';

const TEAM_ROWS: Side[] = [SIDES.AWAY, SIDES.HOME];
const KEY_STEP_SECONDS = 5;
const SHIFT_KEY_STEP_SECONDS = 60;

type Drag = {
   id: number;
   mode: 'move' | 'stretch';
   startX: number;
   time: GameElapsed;
   seconds: number;
};

type ScenarioTrackProps = {
   events: ScenarioEvent[];
   selectedId: number | undefined;
   cursor: GameElapsed;
   teams: Record<Side, string>;
   colors: Record<Side, string>;
   onChange: (event: ScenarioEvent) => void;
   onSelect: (id: number | undefined) => void;
   onRemove: (id: number) => void;
   onCursor: (time: GameElapsed) => void;
};

const percent = (fraction: number): string => `${fraction * 100}%`;

const eventTitle = (event: ScenarioEvent, team: string): string => {
   const what =
      event.kind === 'goal'
         ? 'goal'
         : `#${event.id} ${SCENARIO_PENALTY_RULES[event.penaltyType].label.toLowerCase()}`;
   return `${team} ${what} · ${periodLabel(scenarioPeriod(event.time), SCENARIO_PERIODS)} ${scenarioClock(event.time)}`;
};

function ScenarioTrack({
   events,
   selectedId,
   cursor,
   teams,
   colors,
   onChange,
   onSelect,
   onRemove,
   onCursor,
}: ScenarioTrackProps) {
   const laneRef = useRef<HTMLDivElement>(null);
   const dragRef = useRef<Drag | null>(null);
   const { laneOf, laneCount } = penaltyLanes(events);

   const secondsPerPixel = (): number => {
      const width = laneRef.current?.getBoundingClientRect().width ?? 0;
      return width > 0 ? trackSeconds(1 / width) : 0;
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
      if (!drag) return;
      const event = events.find((candidate) => candidate.id === drag.id);
      if (!event) return;
      const delta = (e.clientX - drag.startX) * secondsPerPixel();
      if (drag.mode === 'move') {
         const time = snapTime(drag.time + delta);
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
      onCursor(snapTime(trackSeconds((e.clientX - box.left) / box.width)));
      onSelect(undefined);
   };

   const onKeyDown = (event: ScenarioEvent) => (e: KeyboardEvent) => {
      const step = e.shiftKey ? SHIFT_KEY_STEP_SECONDS : KEY_STEP_SECONDS;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
         e.preventDefault();
         const time = snapTime(event.time + (e.key === 'ArrowLeft' ? -step : step));
         onChange({ ...event, time });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
         e.preventDefault();
         onRemove(event.id);
      }
   };

   const markerProps = (event: ScenarioEvent) => ({
      'type': 'button' as const,
      'title': eventTitle(event, teams[event.side]),
      'aria-pressed': event.id === selectedId,
      'onPointerDown': startDrag(event, 'move'),
      'onFocus': () => onSelect(event.id),
      'onKeyDown': onKeyDown(event),
   });

   const penaltyBox = (penalty: ScenarioPenalty) => (
      <button
         key={penalty.id}
         {...markerProps(penalty)}
         className={clsx(
            'scenario-track__penalty',
            penalty.id === selectedId && 'scenario-track__marker--selected',
         )}
         style={{
            'left': percent(trackFraction(penalty.time)),
            'width': percent(trackFraction(penaltySeconds(penalty.penaltyType))),
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

   const rows = TEAM_ROWS.flatMap((side) => [
      ...Array.from({ length: laneCount[side] }, (_, lane) => ({
         key: `${side}-penalty-${lane}`,
         side,
         goals: false,
         label: lane === 0 ? teams[side] : '',
         content: events
            .filter(
               (event): event is ScenarioPenalty =>
                  event.kind === 'penalty' && event.side === side && laneOf.get(event.id) === lane,
            )
            .map(penaltyBox),
      })),
      {
         key: `${side}-goals`,
         side,
         goals: true,
         label: 'Goals',
         content: events
            .filter((event) => event.kind === 'goal' && event.side === side)
            .map((goal) => (
               <button
                  key={goal.id}
                  {...markerProps(goal)}
                  aria-label={eventTitle(goal, teams[side])}
                  className={clsx(
                     'scenario-track__goal',
                     goal.id === selectedId && 'scenario-track__marker--selected',
                  )}
                  style={{
                     'left': percent(trackFraction(goal.time)),
                     '--team-color': colors[side],
                  }}
               />
            )),
      },
   ]);

   return (
      <div
         className="scenario-track"
         style={{ gridTemplateRows: `1.5rem repeat(${rows.length}, 2rem)` }}
         onPointerMove={onPointerMove}
         onPointerUp={endDrag}
         onPointerCancel={endDrag}
      >
         <div className="scenario-track__ruler">
            {trackTicks().map((time) => (
               <span
                  key={time}
                  className={clsx(
                     'scenario-track__tick',
                     (time === 0 || isPeriodBreak(time)) && 'scenario-track__tick--period',
                  )}
                  style={{ left: percent(trackFraction(time)) }}
               >
                  {time === 0 || isPeriodBreak(time)
                     ? periodLabel(scenarioPeriod(time), SCENARIO_PERIODS)
                     : scenarioClock(time)}
               </span>
            ))}
         </div>
         <div className="scenario-track__guides" aria-hidden="true">
            {trackTicks().map((time) => (
               <span
                  key={time}
                  className={clsx(
                     'scenario-track__guide',
                     isPeriodBreak(time) && 'scenario-track__guide--period',
                  )}
                  style={{ left: percent(trackFraction(time)) }}
               />
            ))}
            <span
               className="scenario-track__cursor"
               style={{ left: percent(trackFraction(cursor)) }}
            />
         </div>
         {rows.map((row, i) => (
            <Fragment key={row.key}>
               <span
                  className={clsx(
                     'scenario-track__label',
                     row.goals && 'scenario-track__label--goals',
                  )}
                  style={{ gridRow: i + 2 }}
               >
                  {row.label}
               </span>
               <div
                  ref={i === 0 ? laneRef : undefined}
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
