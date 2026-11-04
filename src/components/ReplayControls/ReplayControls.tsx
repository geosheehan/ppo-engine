import '@components/ReplayControls/ReplayControls.css';
import { useMemo, useState } from 'react';
import { PLAYBACKS } from '@components/constants';
import EventJump from '@components/EventJump';
import PlaybackSelect from '@components/PlaybackSelect';
import ReplayTrack from '@components/ReplayTrack';
import StepButtons from '@components/StepButtons';
import { useReplayPlayback } from '@hooks/useReplayPlayback';
import { isGoalStep } from '@domain/steps';
import type { GameElapsed, Play, ReplayPosition, ReplayStep } from '@domain/types';

type ReplayControlsProps = {
   index: number;
   time: GameElapsed;
   plays: Play[];
   steps: ReplayStep[];
   stepIndex: number;
   onChange: (position: ReplayPosition) => void;
};

function ReplayControls({ index, time, plays, steps, stepIndex, onChange }: ReplayControlsProps) {
   const lastStep = steps.length - 1;
   const goTo = (i: number) => onChange(steps[i]);
   const goalSteps = useMemo(
      () => steps.flatMap((step, i) => (isGoalStep(step, plays) ? [i] : [])),
      [steps, plays],
   );

   const [playbackKey, setPlaybackKey] = useState('live-1');
   const { playing, togglePlaying } = useReplayPlayback({
      playback: PLAYBACKS[playbackKey],
      plays,
      steps,
      stepIndex,
      position: { index, time },
      onChange,
   });

   return (
      <div className="replay-controls">
         <ReplayTrack
            stepIndex={stepIndex}
            lastStep={lastStep}
            goalSteps={goalSteps}
            onSeek={goTo}
         />
         <div className="replay-controls__bar">
            <div className="replay-controls__group">
               <span className="replay-controls__position">
                  Play {index + 1} / {plays.length}
               </span>
               <PlaybackSelect value={playbackKey} onChange={setPlaybackKey} />
            </div>
            <StepButtons
               stepIndex={stepIndex}
               lastStep={lastStep}
               playing={playing}
               onStep={goTo}
               onTogglePlaying={togglePlaying}
            />
            <EventJump
               plays={plays}
               steps={steps}
               stepIndex={stepIndex}
               playing={playing}
               onJump={goTo}
            />
         </div>
      </div>
   );
}

export default ReplayControls;
