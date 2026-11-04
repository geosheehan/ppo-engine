import { useEffect, useState } from 'react';
import { LEAD_MS, LOOP_MS, LOOPS_MS, TRAVEL_MS } from '@hooks/constants';

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
         if (elapsed >= LOOPS_MS) {
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
