import { useEffect, useState } from 'react';

const LOOPS = 3;
const LEAD_MS = 400;
const TRAVEL_MS = 700;
const HOLD_MS = 1000;
const LOOP_MS = LEAD_MS + TRAVEL_MS + HOLD_MS;

const easeOut = (t: number): number => 1 - (1 - t) ** 3;

export function useShotProgress(): number {
   const [progress, setProgress] = useState(0);

   useEffect(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      let start: number | undefined;
      let frame: number;

      const tick = (now: number) => {
         start ??= now;
         const elapsed = now - start;
         if (elapsed >= LOOPS * LOOP_MS) {
            setProgress(0);
            return;
         }
         const travelled = (elapsed % LOOP_MS) - LEAD_MS;
         setProgress(travelled <= 0 ? 0 : easeOut(Math.min(travelled / TRAVEL_MS, 1)));
         frame = requestAnimationFrame(tick);
      };

      frame = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frame);
   }, []);

   return progress;
}
