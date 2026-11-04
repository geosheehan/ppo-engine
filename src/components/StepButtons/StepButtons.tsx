import '@components/StepButtons/StepButtons.css';
import EndIcon from '@components/icons/replay/EndIcon';
import NextIcon from '@components/icons/replay/NextIcon';
import PauseIcon from '@components/icons/replay/PauseIcon';
import PlayIcon from '@components/icons/replay/PlayIcon';
import PreviousIcon from '@components/icons/replay/PreviousIcon';
import StartIcon from '@components/icons/replay/StartIcon';

type StepButtonsProps = {
   stepIndex: number;
   lastStep: number;
   playing: boolean;
   disabled?: boolean;
   onStep: (stepIndex: number) => void;
   onTogglePlaying: () => void;
};

function StepButtons({
   stepIndex,
   lastStep,
   playing,
   disabled = false,
   onStep,
   onTogglePlaying,
}: StepButtonsProps) {
   const atStart = disabled || stepIndex === 0;
   const atEnd = disabled || stepIndex === lastStep;

   return (
      <div className="step-buttons">
         <button
            type="button"
            aria-label="Start"
            title="Start"
            onClick={() => onStep(0)}
            disabled={atStart || playing}
         >
            <StartIcon />
         </button>
         <button
            type="button"
            aria-label="Previous step"
            title="Previous step"
            onClick={() => onStep(stepIndex - 1)}
            disabled={atStart || playing}
         >
            <PreviousIcon />
         </button>
         <button
            type="button"
            className="step-buttons__play"
            aria-label={playing ? 'Pause' : 'Play'}
            title={playing ? 'Pause' : 'Play'}
            onClick={onTogglePlaying}
            disabled={atEnd}
         >
            {playing ? <PauseIcon /> : <PlayIcon />}
         </button>
         <button
            type="button"
            aria-label="Next step"
            title="Next step"
            onClick={() => onStep(stepIndex + 1)}
            disabled={atEnd || playing}
         >
            <NextIcon />
         </button>
         <button
            type="button"
            aria-label="End"
            title="End"
            onClick={() => onStep(lastStep)}
            disabled={atEnd || playing}
         >
            <EndIcon />
         </button>
      </div>
   );
}

export default StepButtons;
