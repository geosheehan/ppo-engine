export const SIMILAR_DISTANCE = 0.15;

const linear = (channel: number): number => {
   const c = channel / 255;
   return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

function toOklab(hex: string): [number, number, number] {
   const [r, g, b] = [1, 3, 5].map((i) => linear(parseInt(hex.slice(i, i + 2), 16)));
   const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
   const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
   const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
   return [
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
   ];
}

export function colorDistance(a: string, b: string): number {
   const [l1, a1, b1] = toOklab(a);
   const [l2, a2, b2] = toOklab(b);
   return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

export const areSimilar = (a: string, b: string): boolean => colorDistance(a, b) < SIMILAR_DISTANCE;

export function matchupColors(home: string[], away: string[]): { home: string; away: string } {
   const [home1, home2] = home;
   const [away1, away2] = away;
   if (!areSimilar(home1, away1)) return { home: home1, away: away1 };
   if (home2 && away2 && !areSimilar(home2, away2)) return { home: home2, away: away2 };
   if (away2) return { home: home1, away: away2 };
   return { home: home2 ?? home1, away: away1 };
}

export const textColorOn = (background: string): string => (toOklab(background)[0] > 0.62 ? '#000000' : '#ffffff');
