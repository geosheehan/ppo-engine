import { useState, useEffect } from 'react';
import '@components/ReplayControls.css';

type ReplayControlsProps = {
   index: number;
   count: number;
   onChange: (index: number) => void;
};


function ReplayControls({ index, count, onChange }: ReplayControlsProps) {
   const last = count - 1;
   const [autoPlay, setAutoPlay] = useState(false);
   const playing = autoPlay && index < last;

   useEffect(() => {
      if (!playing) return;
      const timer = setTimeout(() => onChange(index + 1), 1000);
      return () => clearTimeout(timer);
   }, [playing, index, onChange]);

   return (
      <div className="replay-controls">
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
         <button type="button" onClick={() => setAutoPlay(!playing)} disabled={index === last}>
            {playing ? 'Pause' : 'Play'}
         </button>
         <span className="replay-controls__position">Play {index + 1} of {count}</span>
      </div>
   );
};

export default ReplayControls;
