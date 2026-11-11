import '@components/ReplayControls/ReplayControls.css';
import { useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { clsx } from 'clsx';
import { PLAYBACKS } from '@components/constants';
import EventJump from '@components/EventJump';
import MoreIcon from '@components/icons/replay/MoreIcon';
import PlaybackSelect from '@components/PlaybackSelect';
import ReplayTrack from '@components/ReplayTrack';
import StepButtons from '@components/StepButtons';
import { useReplayPlayback } from '@hooks/useReplayPlayback';
import { isGoalStep } from '@domain/steps';
import type { GameElapsed, Play, ReplayPosition, ReplayStep } from '@domain/types';

type ReplayControlsProps = {
   index?: number;
   time?: GameElapsed;
   plays?: Play[];
   steps?: ReplayStep[];
   stepIndex?: number;
   onChange?: (position: ReplayPosition) => void;
};

const NO_PLAYS: Play[] = [];
const NO_STEPS: ReplayStep[] = [];
const ignoreChange = () => {};

function ReplayControls({
   index = 0,
   time = 0,
   plays = NO_PLAYS,
   steps = NO_STEPS,
   stepIndex = 0,
   onChange = ignoreChange,
}: ReplayControlsProps) {
   const disabled = steps.length === 0;
   const lastStep = steps.length - 1;
   const goTo = (i: number) => onChange(steps[i]);
   const goalSteps = useMemo(
      () => steps.flatMap((step, i) => (isGoalStep(step, plays) ? [i] : [])),
      [steps, plays],
   );

   const [playbackKey, setPlaybackKey] = useState('live-1');
   const [jumpOpen, setJumpOpen] = useState(false);
   const jumpId = useId();
   const jumpToggle = useRef<HTMLButtonElement>(null);
   const { playing, togglePlaying } = useReplayPlayback({
      playback: PLAYBACKS[playbackKey],
      plays,
      steps,
      stepIndex,
      position: { index, time },
      onChange,
   });

   const closeJumpOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Escape' || !jumpOpen) return;
      setJumpOpen(false);
      jumpToggle.current?.focus();
   };

   return (
      <div className="replay-controls">
         <div className="replay-controls__essentials">
            <span className="replay-controls__count">
               <span className="visually-hidden">Play </span>
               <span>{disabled ? '–' : index + 1}</span>
               <span className="visually-hidden"> of </span>
               <span className="replay-controls__count-total">{disabled ? '–' : plays.length}</span>
            </span>
            <ReplayTrack
               stepIndex={stepIndex}
               lastStep={lastStep}
               goalSteps={goalSteps}
               disabled={disabled}
               onSeek={goTo}
            />
            <StepButtons
               stepIndex={stepIndex}
               lastStep={lastStep}
               playing={playing}
               disabled={disabled}
               onStep={goTo}
               onTogglePlaying={togglePlaying}
            />
            <button
               ref={jumpToggle}
               type="button"
               className="replay-controls__jump-toggle"
               aria-label="More options"
               title="More options"
               aria-expanded={jumpOpen}
               aria-controls={jumpId}
               onClick={() => setJumpOpen((open) => !open)}
            >
               <MoreIcon />
            </button>
            <div
               id={jumpId}
               className={clsx('replay-controls__jump', jumpOpen && 'replay-controls__jump--open')}
               onKeyDown={closeJumpOnEscape}
            >
               <EventJump
                  plays={plays}
                  steps={steps}
                  stepIndex={stepIndex}
                  playing={playing}
                  disabled={disabled}
                  onJump={goTo}
               />
               <div className="replay-controls__speed">
                  <span aria-hidden="true">Speed</span>
                  <PlaybackSelect
                     value={playbackKey}
                     disabled={disabled}
                     onChange={setPlaybackKey}
                  />
               </div>
            </div>
         </div>
         <div className="replay-controls__extras">
            <div className="replay-controls__group">
               <span className="replay-controls__position">
                  {disabled ? 'Play – / –' : `Play ${index + 1} / ${plays.length}`}
               </span>
               <PlaybackSelect value={playbackKey} disabled={disabled} onChange={setPlaybackKey} />
            </div>
         </div>
      </div>
   );
}

export default ReplayControls;
