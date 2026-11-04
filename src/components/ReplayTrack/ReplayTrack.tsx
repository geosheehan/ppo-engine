import '@components/ReplayTrack/ReplayTrack.css';

type ReplayTrackProps = {
   stepIndex: number;
   lastStep: number;
   goalSteps: number[];
   onSeek: (stepIndex: number) => void;
};

// The replay's progress slider, with a mark under each goal already reached.
function ReplayTrack({ stepIndex, lastStep, goalSteps, onSeek }: ReplayTrackProps) {
   const at = (step: number): number => step / Math.max(lastStep, 1);

   return (
      <div className="replay-track">
         <input
            type="range"
            className="replay-track__slider"
            aria-label="Replay position"
            min={0}
            max={lastStep}
            value={stepIndex}
            onChange={(event) => onSeek(Number(event.target.value))}
            style={{ '--replay-track-progress': at(stepIndex) }}
         />
         {goalSteps
            .filter((goalStep) => goalStep <= stepIndex)
            .map((goalStep) => (
               <span
                  key={goalStep}
                  className="replay-track__goal-mark"
                  style={{ '--replay-track-goal-position': at(goalStep) }}
               />
            ))}
      </div>
   );
}

export default ReplayTrack;
