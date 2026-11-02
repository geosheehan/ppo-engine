import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import '@components/ReplayControls.css';
import StartIcon from '@components/replay-icons/StartIcon.tsx';
import PreviousIcon from '@components/replay-icons/PreviousIcon.tsx';
import PlayIcon from '@components/replay-icons/PlayIcon.tsx';
import PauseIcon from '@components/replay-icons/PauseIcon.tsx';
import NextIcon from '@components/replay-icons/NextIcon.tsx';
import EndIcon from '@components/replay-icons/EndIcon.tsx';
import { EVENT_TYPES, playTypeLabel } from '@domain/plays.ts';
import { isGoal } from '@domain/types.ts';
import type { Play } from '@domain/types.ts';

type ReplayControlsProps = {
   index: number;
   plays: Play[];
   onChange: (index: number) => void;
};

const REPLAY_MINUTES = [10, 7, 5];

const GOAL_HOLD = 3;
const hold = (play: Play): number => (isGoal(play) ? GOAL_HOLD : 1);

function ReplayControls({ index, plays, onChange }: ReplayControlsProps) {
   const last = plays.length - 1;
   const [autoPlay, setAutoPlay] = useState(false);
   const playing = autoPlay && index < last;

   const [replayMinutes, setReplayMinutes] = useState(REPLAY_MINUTES[0]);
   const totalHolds = plays.slice(0, last).reduce((sum, play) => sum + hold(play), 0);
   const delay = ((replayMinutes * 60 * 1000) / Math.max(totalHolds, 1)) * hold(plays[index]);

   const goalIndexes = plays.flatMap((play, i) => (isGoal(play) ? [i] : []));

   const [eventType, setEventType] = useState('goal');
   const previousOfType = plays.findLastIndex((play, i) => i < index && play.typeDescKey === eventType);
   const nextOfType = plays.findIndex((play, i) => i > index && play.typeDescKey === eventType);
   const eventLabel = playTypeLabel(eventType).toLowerCase();

   useEffect(() => {
      if (!playing) return;
      const timer = setTimeout(() => onChange(index + 1), delay);
      return () => clearTimeout(timer);
   }, [playing, index, onChange, delay]);

   return (
      <div className="replay-controls">
         <div className="replay-controls__track">
            <input
               type="range"
               className="replay-controls__slider"
               aria-label="Play"
               min={0}
               max={last}
               value={index}
               onChange={(event) => onChange(Number(event.target.value))}
               style={{ '--progress': index / Math.max(last, 1) } as CSSProperties}
            />
            {goalIndexes.filter((goalIndex) => goalIndex <= index).map((goalIndex) => (
               <span
                  key={goalIndex}
                  className="replay-controls__goal-mark"
                  style={{ '--at': goalIndex / Math.max(last, 1) } as CSSProperties}
               />
            ))}
         </div>
         <div className="replay-controls__bar">
            <div className="replay-controls__group">
               <span className="replay-controls__position">Play {index + 1} / {plays.length}</span>
               <select aria-label="Replay length" value={replayMinutes} onChange={(event) => setReplayMinutes(Number(event.target.value))}>
                  {REPLAY_MINUTES.map((minutes, i) => (
                     <option key={minutes} value={minutes}>x{i + 1}</option>
                  ))}
               </select>
            </div>
            <div className="replay-controls__group">
               <button type="button" aria-label="Start" title="Start" onClick={() => onChange(0)} disabled={index === 0 || playing}>
                  <StartIcon />
               </button>
               <button type="button" aria-label="Previous play" title="Previous play" onClick={() => onChange(index - 1)} disabled={index === 0 || playing}>
                  <PreviousIcon />
               </button>
               <button
                  type="button"
                  className="replay-controls__play"
                  aria-label={playing ? 'Pause' : 'Play'}
                  title={playing ? 'Pause' : 'Play'}
                  onClick={() => setAutoPlay(!playing)}
                  disabled={index === last}
               >
                  {playing ? <PauseIcon /> : <PlayIcon />}
               </button>
               <button type="button" aria-label="Next play" title="Next play" onClick={() => onChange(index + 1)} disabled={index === last || playing}>
                  <NextIcon />
               </button>
               <button type="button" aria-label="End" title="End" onClick={() => onChange(last)} disabled={index === last || playing}>
                  <EndIcon />
               </button>
            </div>
            <div className="replay-controls__group">
               <button
                  type="button"
                  aria-label={`Previous ${eventLabel}`}
                  title={`Previous ${eventLabel}`}
                  onClick={() => onChange(previousOfType)}
                  disabled={previousOfType === -1 || playing}
               >
                  <PreviousIcon />
               </button>
               <select aria-label="Event type" value={eventType} onChange={(event) => setEventType(event.target.value)}>
                  {EVENT_TYPES.map((type) => (
                     <option key={type} value={type}>{playTypeLabel(type)}</option>
                  ))}
               </select>
               <button
                  type="button"
                  aria-label={`Next ${eventLabel}`}
                  title={`Next ${eventLabel}`}
                  onClick={() => onChange(nextOfType)}
                  disabled={nextOfType === -1 || playing}
               >
                  <NextIcon />
               </button>
            </div>
         </div>
      </div>
   );
};

export default ReplayControls;
