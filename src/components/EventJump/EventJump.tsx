import '@components/EventJump/EventJump.css';
import { useMemo, useState } from 'react';
import NextIcon from '@components/icons/replay/NextIcon';
import PreviousIcon from '@components/icons/replay/PreviousIcon';
import { PLAY_TYPES } from '@domain/constants';
import { lastIndexWhere } from '@domain/search';
import { STEP_TYPES, stepType, stepTypeLabel } from '@domain/steps';
import type { Play, ReplayStep, StepType } from '@domain/types';

type EventJumpProps = {
   plays: Play[];
   steps: ReplayStep[];
   stepIndex: number;
   playing: boolean;
   onJump: (stepIndex: number) => void;
};

const JUMP_TYPES = STEP_TYPES.toSorted((a, b) => stepTypeLabel(a).localeCompare(stepTypeLabel(b)));

// Jumps to the previous or next step of a chosen type, such as the next goal.
function EventJump({ plays, steps, stepIndex, playing, onJump }: EventJumpProps) {
   const [eventType, setEventType] = useState<StepType>(PLAY_TYPES.GOAL);
   const stepsOfType = useMemo(
      () => steps.flatMap((step, i) => (stepType(step, plays) === eventType ? [i] : [])),
      [steps, plays, eventType],
   );
   const previousOfType = stepsOfType[lastIndexWhere(stepsOfType, (i) => i < stepIndex)] ?? -1;
   const nextOfType = stepsOfType[lastIndexWhere(stepsOfType, (i) => i <= stepIndex) + 1] ?? -1;
   const eventLabel = stepTypeLabel(eventType).toLowerCase();

   return (
      <div className="event-jump">
         <button
            type="button"
            aria-label={`Previous ${eventLabel}`}
            title={`Previous ${eventLabel}`}
            onClick={() => onJump(previousOfType)}
            disabled={previousOfType === -1 || playing}
         >
            <PreviousIcon />
         </button>
         <select
            aria-label="Event type"
            value={eventType}
            onChange={(event) =>
               setEventType(JUMP_TYPES.find((type) => type === event.target.value) ?? eventType)
            }
         >
            {JUMP_TYPES.map((type) => (
               <option key={type} value={type}>
                  {stepTypeLabel(type)}
               </option>
            ))}
         </select>
         <button
            type="button"
            aria-label={`Next ${eventLabel}`}
            title={`Next ${eventLabel}`}
            onClick={() => onJump(nextOfType)}
            disabled={nextOfType === -1 || playing}
         >
            <NextIcon />
         </button>
      </div>
   );
}

export default EventJump;
