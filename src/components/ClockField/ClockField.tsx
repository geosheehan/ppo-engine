import '@components/ClockField/ClockField.css';
import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { clockToSeconds, maskClock } from '@domain/clock';
import {
   periodTime,
   SCENARIO_SNAP_SECONDS,
   scenarioClock,
   scenarioPeriod,
   snapTime,
} from '@domain/scenario';
import type { ScenarioSetup } from '@domain/scenario';
import type { GameElapsed } from '@domain/types';

const SCRUB_START_PX = 6;
const SCRUB_PX_PER_STEP = 10;

type Scrub = { startX: number; time: GameElapsed; moved: boolean };

type ClockFieldProps = {
   time: GameElapsed;
   setup: ScenarioSetup;
   label: string;
   onTime: (time: GameElapsed) => void;
};

function ClockField({ time, setup, label, onTime }: ClockFieldProps) {
   const [draft, setDraft] = useState<string>();
   const scrubRef = useRef<Scrub | null>(null);

   const commit = () => {
      if (draft !== undefined)
         onTime(periodTime(setup, scenarioPeriod(time, setup), clockToSeconds(draft)));
      setDraft(undefined);
   };

   const onPointerDown = (e: PointerEvent<HTMLInputElement>) => {
      if (e.button !== 0 || document.activeElement === e.currentTarget) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      scrubRef.current = { startX: e.clientX, time, moved: false };
   };

   const onPointerMove = (e: PointerEvent<HTMLInputElement>) => {
      const scrub = scrubRef.current;
      if (!scrub) return;
      const dx = e.clientX - scrub.startX;
      if (!scrub.moved && Math.abs(dx) < SCRUB_START_PX) return;
      scrub.moved = true;
      const steps = Math.round(dx / SCRUB_PX_PER_STEP);
      const next = snapTime(scrub.time + steps * SCENARIO_SNAP_SECONDS, setup);
      if (next !== time) onTime(next);
   };

   const onPointerUp = (e: PointerEvent<HTMLInputElement>) => {
      if (scrubRef.current?.moved === false) e.currentTarget.focus();
      scrubRef.current = null;
   };

   return (
      <input
         className="clock-field"
         inputMode="numeric"
         aria-label={label}
         title="Type a time, or drag sideways"
         value={draft ?? scenarioClock(time, setup)}
         onChange={(e) => setDraft(maskClock(e.target.value))}
         onFocus={(e) => e.currentTarget.select()}
         onBlur={commit}
         onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            else if (e.key === 'Escape') setDraft(undefined);
         }}
         onPointerDown={onPointerDown}
         onPointerMove={onPointerMove}
         onPointerUp={onPointerUp}
         onPointerCancel={() => {
            scrubRef.current = null;
         }}
      />
   );
}

export default ClockField;
