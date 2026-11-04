import { useEffect, useMemo, useState } from 'react';
import { GOAL_HOLD_MS, GOAL_STEP_WEIGHT } from '@hooks/constants';
import type { Playback } from '@hooks/types';
import { useLivePlayback } from '@hooks/useLivePlayback';
import { isGoalStep } from '@domain/steps';
import type { Play, ReplayPosition, ReplayStep } from '@domain/types';

type ReplayPlaybackOptions = {
   playback: Playback;
   plays: Play[];
   steps: ReplayStep[];
   stepIndex: number;
   position: ReplayPosition;
   onChange: (position: ReplayPosition) => void;
};

const stepWeight = (step: ReplayStep, plays: Play[]): number =>
   isGoalStep(step, plays) ? GOAL_STEP_WEIGHT : 1;

export function useReplayPlayback({
   playback,
   plays,
   steps,
   stepIndex,
   position,
   onChange,
}: ReplayPlaybackOptions) {
   const lastStep = steps.length - 1;
   const [autoPlay, setAutoPlay] = useState(false);
   const playing = autoPlay && stepIndex < lastStep;
   const live = playback.mode === 'live';

   const totalWeight = useMemo(
      () => steps.slice(0, -1).reduce((sum, step) => sum + stepWeight(step, plays), 0),
      [steps, plays],
   );
   // No step while a game is still loading.
   const step = steps.at(stepIndex);
   const scaledDelay =
      live || step === undefined
         ? 0
         : ((playback.minutes * 60 * 1000) / Math.max(totalWeight, 1)) * stepWeight(step, plays);
   const delay =
      step !== undefined && isGoalStep(step, plays)
         ? Math.max(scaledDelay, GOAL_HOLD_MS)
         : scaledDelay;

   useEffect(() => {
      if (!playing || live) return;
      const next = steps[stepIndex + 1];
      const timer = setTimeout(() => onChange(next), delay);
      return () => clearTimeout(timer);
   }, [playing, live, steps, stepIndex, onChange, delay]);

   useLivePlayback(playing && live, live ? playback.speed : 1, plays, position, onChange);

   return { playing, togglePlaying: () => setAutoPlay(!playing) };
}
