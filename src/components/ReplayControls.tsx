import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import '@components/ReplayControls.css';
import StartIcon from '@components/replay-icons/StartIcon.tsx';
import PreviousIcon from '@components/replay-icons/PreviousIcon.tsx';
import PlayIcon from '@components/replay-icons/PlayIcon.tsx';
import PauseIcon from '@components/replay-icons/PauseIcon.tsx';
import NextIcon from '@components/replay-icons/NextIcon.tsx';
import EndIcon from '@components/replay-icons/EndIcon.tsx';
import { useLivePlayback } from '@components/useLivePlayback.ts';
import { SHOT_ANIMATION_MS } from '@components/useShotProgress.ts';
import { PLAY_TYPES } from '@domain/constants.ts';
import { STEP_TYPES, stepType, stepTypeLabel } from '@domain/steps.ts';
import type { ReplayStep, StepType } from '@domain/steps.ts';
import { isGoal } from '@domain/types.ts';
import type { GameElapsed, Play } from '@domain/types.ts';

type ReplayControlsProps = {
   index: number;
   time: GameElapsed;
   plays: Play[];
   steps: ReplayStep[];
   stepIndex: number;
   onChange: (index: number, time?: GameElapsed, changedTeamId?: number) => void;
};

type Playback = { label: string } & (
   { 
      mode: 'live';
      speed: number
   } | { 
      mode: 'length';
      minutes: number
   }
);

const PLAYBACKS: Record<string, Playback> = {
   'live-1': { mode: 'live', speed: 1, label: 'x1' },
   'live-3': { mode: 'live', speed: 3, label: 'x3' },
   'live-6': { mode: 'live', speed: 6, label: 'x6' },
   'length-10': { mode: 'length', minutes: 10, label: '10 min' },
   'length-7': { mode: 'length', minutes: 7, label: '7 min' },
   'length-5': { mode: 'length', minutes: 5, label: '5 min' },
};

const playbackOptions = (mode: Playback['mode']) =>
   Object.entries(PLAYBACKS)
      .filter(([, playback]) => playback.mode === mode)
      .map(([value, { label }]) => <option key={value} value={value}>{label}</option>);

const JUMP_TYPES = STEP_TYPES.toSorted((a, b) => stepTypeLabel(a).localeCompare(stepTypeLabel(b)));

const GOAL_HOLD = 3;

function ReplayControls({ index, time, plays, steps, stepIndex, onChange }: ReplayControlsProps) {
   const lastStep = steps.length - 1;
   const [autoPlay, setAutoPlay] = useState(false);
   const playing = autoPlay && stepIndex < lastStep;
   const goTo = (i: number) => onChange(steps[i].index, steps[i].time, steps[i].changedTeamId);

   const [playbackKey, setPlaybackKey] = useState('live-1');
   const playback = PLAYBACKS[playbackKey];
   const live = playback.mode === 'live';

   const isGoalStep = (step: ReplayStep): boolean => !step.changedTeamId && isGoal(plays[step.index]);
   const hold = (step: ReplayStep): number => (isGoalStep(step) ? GOAL_HOLD : 1);
   const totalHolds = steps.slice(0, lastStep).reduce((sum, step) => sum + hold(step), 0);
   const scaledDelay = live ? 0 : ((playback.minutes * 60 * 1000) / Math.max(totalHolds, 1)) * hold(steps[stepIndex]);
   const delay = isGoalStep(steps[stepIndex]) ? Math.max(scaledDelay, SHOT_ANIMATION_MS) : scaledDelay;

   const goalSteps = steps.flatMap((step, i) => (isGoalStep(step) ? [i] : []));

   const [eventType, setEventType] = useState<StepType>(PLAY_TYPES.GOAL);
   const previousOfType = steps.findLastIndex((step, i) => i < stepIndex && stepType(step, plays) === eventType);
   const nextOfType = steps.findIndex((step, i) => i > stepIndex && stepType(step, plays) === eventType);
   const eventLabel = stepTypeLabel(eventType).toLowerCase();

   useEffect(() => {
      if (!playing || live) return;
      const next = steps[stepIndex + 1];
      const timer = setTimeout(() => onChange(next.index, next.time, next.changedTeamId), delay);
      return () => clearTimeout(timer);
   }, [playing, live, steps, stepIndex, onChange, delay]);

   useLivePlayback(playing && live, live ? playback.speed : 1, plays, { index, time }, onChange);

   return (
      <div className="replay-controls">
         <div className="replay-controls__track">
            <input
               type="range"
               className="replay-controls__slider"
               aria-label="Replay position"
               min={0}
               max={lastStep}
               value={stepIndex}
               onChange={(event) => goTo(Number(event.target.value))}
               style={{ '--progress': stepIndex / Math.max(lastStep, 1) } as CSSProperties}
            />
            {goalSteps.filter((goalStep) => goalStep <= stepIndex).map((goalStep) => (
               <span
                  key={goalStep}
                  className="replay-controls__goal-mark"
                  style={{ '--at': goalStep / Math.max(lastStep, 1) } as CSSProperties}
               />
            ))}
         </div>
         <div className="replay-controls__bar">
            <div className="replay-controls__group">
               <span className="replay-controls__position">Play {index + 1} / {plays.length}</span>
               <select aria-label="Replay speed" value={playbackKey} onChange={(event) => setPlaybackKey(event.target.value)}>
                  <optgroup label="Live clock">{playbackOptions('live')}</optgroup>
                  <optgroup label="Replay length">{playbackOptions('length')}</optgroup>
               </select>
            </div>
            <div className="replay-controls__group">
               <button type="button" aria-label="Start" title="Start" onClick={() => goTo(0)} disabled={stepIndex === 0 || playing}>
                  <StartIcon />
               </button>
               <button type="button" aria-label="Previous step" title="Previous step" onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0 || playing}>
                  <PreviousIcon />
               </button>
               <button
                  type="button"
                  className="replay-controls__play"
                  aria-label={playing ? 'Pause' : 'Play'}
                  title={playing ? 'Pause' : 'Play'}
                  onClick={() => setAutoPlay(!playing)}
                  disabled={stepIndex === lastStep}
               >
                  {playing ? <PauseIcon /> : <PlayIcon />}
               </button>
               <button type="button" aria-label="Next step" title="Next step" onClick={() => goTo(stepIndex + 1)} disabled={stepIndex === lastStep || playing}>
                  <NextIcon />
               </button>
               <button type="button" aria-label="End" title="End" onClick={() => goTo(lastStep)} disabled={stepIndex === lastStep || playing}>
                  <EndIcon />
               </button>
            </div>
            <div className="replay-controls__group">
               <button
                  type="button"
                  aria-label={`Previous ${eventLabel}`}
                  title={`Previous ${eventLabel}`}
                  onClick={() => goTo(previousOfType)}
                  disabled={previousOfType === -1 || playing}
               >
                  <PreviousIcon />
               </button>
               <select aria-label="Event type" value={eventType} onChange={(event) => setEventType(JUMP_TYPES.find((type) => type === event.target.value) ?? eventType)}>
                  {JUMP_TYPES.map((type) => (
                     <option key={type} value={type}>{stepTypeLabel(type)}</option>
                  ))}
               </select>
               <button
                  type="button"
                  aria-label={`Next ${eventLabel}`}
                  title={`Next ${eventLabel}`}
                  onClick={() => goTo(nextOfType)}
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
