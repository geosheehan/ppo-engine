import { useCallback, useState } from 'react';

export function useElementWidth<T extends HTMLElement>() {
   const [width, setWidth] = useState(0);
   const ref = useCallback((element: T | null) => {
      if (!element) return;
      setWidth(element.getBoundingClientRect().width);
      const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
      observer.observe(element);
      return () => observer.disconnect();
   }, []);
   return [ref, width] as const;
}
