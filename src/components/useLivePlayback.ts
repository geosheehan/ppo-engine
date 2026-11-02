import { useEffect, useRef } from 'react';
import { livePosition } from '@domain/playback.ts';
import type { ReplayPosition } from '@domain/playback.ts';
import type { Play } from '@domain/types.ts';
import { SHOT_ANIMATION_MS } from '@components/useShotProgress.ts';

const TICK_MS = 50;

const samePosition = (a: ReplayPosition, b: ReplayPosition): boolean => a.index === b.index && a.time === b.time;

export function useLivePlayback(
   active: boolean,
   speed: number,
   plays: Play[],
   position: ReplayPosition,
   onChange: (index: number, time: number) => void,
) {
   const positionRef = useRef(position);
   useEffect(() => {
      positionRef.current = position;
   });

   useEffect(() => {
      if (!active) return;

      let start = positionRef.current;
      let startedAt = performance.now();
      let emitted = start;

      const timer = setInterval(() => {
         if (!samePosition(positionRef.current, emitted)) {
            start = positionRef.current;
            startedAt = performance.now();
            emitted = start;
         }
         const next = livePosition(plays, start, performance.now() - startedAt, speed, SHOT_ANIMATION_MS);
         if (samePosition(next, emitted)) return;
         emitted = next;
         positionRef.current = next;
         onChange(next.index, next.time);
      }, TICK_MS);

      return () => clearInterval(timer);
   }, [active, speed, plays, onChange]);
}
