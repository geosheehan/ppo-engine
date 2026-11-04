import { useEffect, useRef } from 'react';
import { GOAL_HOLD_MS, SAME_SECOND_HOLD_MS } from '@hooks/constants';
import { livePosition } from '@domain/playback';
import type { GameElapsed, Play, ReplayPosition } from '@domain/types';

const TICK_MS = 50;

const samePosition = (a: ReplayPosition, b: ReplayPosition): boolean =>
   a.index === b.index && a.time === b.time;

export function useLivePlayback(
   active: boolean,
   speed: number,
   plays: Play[],
   position: ReplayPosition,
   onChange: (index: number, time: GameElapsed) => void,
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
         const next = livePosition(plays, start, performance.now() - startedAt, speed, {
            goalMs: GOAL_HOLD_MS,
            sameSecondMs: SAME_SECOND_HOLD_MS,
         });
         if (samePosition(next, emitted)) return;
         emitted = next;
         positionRef.current = next;
         onChange(next.index, next.time);
      }, TICK_MS);

      return () => clearInterval(timer);
   }, [active, speed, plays, onChange]);
}
