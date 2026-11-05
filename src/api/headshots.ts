type Headshot = {
   image: HTMLImageElement;
   done: Promise<void>;
};

// One Image per URL for the whole session, so each headshot is requested from the NHL once. Holding
// the element keeps it in the browser's in-memory image list, which later <img> tags reuse. A failed
// URL settles too and is never retried.
const headshots = new Map<string, Headshot>();
const loaded = new Set<string>();
const listeners = new Set<() => void>();

export function loadHeadshot(url: string): Promise<void> {
   const existing = headshots.get(url);
   if (existing !== undefined) return existing.done;
   const image = new Image();
   const done = new Promise<void>((resolve) => {
      image.onload = () => {
         loaded.add(url);
         listeners.forEach((listener) => listener());
         resolve();
      };
      image.onerror = () => resolve();
   });
   image.src = url;
   headshots.set(url, { image, done });
   return done;
}

export const isHeadshotLoaded = (url: string): boolean => loaded.has(url);

export const subscribeHeadshots = (listener: () => void) => {
   listeners.add(listener);
   return () => listeners.delete(listener);
};
