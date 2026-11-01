import { useState, useEffect, useMemo } from 'react';
import '@components/ReplayControls.css';
import { playTypeLabel } from '@domain/plays.ts';
import type { Play } from '@domain/types.ts';

type ReplayControlsProps = {
   index: number;
   plays: Play[];
   onChange: (index: number) => void;
};


function ReplayControls({ index, plays, onChange }: ReplayControlsProps) {
   const last = plays.length - 1;
   const [autoPlay, setAutoPlay] = useState(false);
   const playing = autoPlay && index < last;

   // The event types that occur in this game, for jumping between plays of one type.
   const eventTypes = useMemo(() => [...new Set(plays.map((play) => play.typeDescKey))].toSorted(), [plays]);
   const [eventType, setEventType] = useState(() => (eventTypes.includes('goal') ? 'goal' : eventTypes[0]));
   const previousOfType = plays.findLastIndex((play, i) => i < index && play.typeDescKey === eventType);
   const nextOfType = plays.findIndex((play, i) => i > index && play.typeDescKey === eventType);
   const eventLabel = playTypeLabel(eventType).toLowerCase();

   useEffect(() => {
      if (!playing) return;
      const timer = setTimeout(() => onChange(index + 1), 1000);
      return () => clearTimeout(timer);
   }, [playing, index, onChange]);

   return (
      <div className="replay-controls">
         <div className="replay-controls__row">
            <button type="button" onClick={() => onChange(0)} disabled={index === 0 || playing}>
               Start
            </button>
            <button type="button" onClick={() => onChange(index - 1)} disabled={index === 0 || playing}>
               Previous
            </button>
            <input
               type="range"
               className="replay-controls__slider"
               aria-label="Play"
               min={0}
               max={last}
               value={index}
               onChange={(event) => onChange(Number(event.target.value))}
            />
            <button type="button" onClick={() => onChange(index + 1)} disabled={index === last || playing}>
               Next
            </button>
            <button type="button" onClick={() => onChange(last)} disabled={index === last || playing}>
               End
            </button>
            <button type="button" onClick={() => setAutoPlay(!playing)} disabled={index === last}>
               {playing ? 'Pause' : 'Play'}
            </button>
            <span className="replay-controls__position">Play {index + 1} of {plays.length}</span>
         </div>
         <div className="replay-controls__row">
            <select aria-label="Event type" value={eventType} onChange={(event) => setEventType(event.target.value)}>
               {eventTypes.map((type) => (
                  <option key={type} value={type}>{playTypeLabel(type)}</option>
               ))}
            </select>
            <button type="button" onClick={() => onChange(previousOfType)} disabled={previousOfType === -1 || playing}>
               Previous {eventLabel}
            </button>
            <button type="button" onClick={() => onChange(nextOfType)} disabled={nextOfType === -1 || playing}>
               Next {eventLabel}
            </button>
         </div>
      </div>
   );
};

export default ReplayControls;
