import { DEFAULT_TEAM_COLORS } from '@domain/constants';

export const SIMILAR_DISTANCE = 0.156;

export const DARK_LIGHTNESS = 0.3;
export const DARK_MIN_CONTRAST = 1.3;

export type Similarity = { cutoff: number; darkContrast: number };

export const SIMILARITY: Similarity = { cutoff: SIMILAR_DISTANCE, darkContrast: DARK_MIN_CONTRAST };

const linear = (channel: number): number => {
   const c = channel / 255;
   return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const channels = (hex: string): number[] =>
   [1, 3, 5].map((i) => linear(parseInt(hex.slice(i, i + 2), 16)));

function toOklab(hex: string): [number, number, number] {
   const [r, g, b] = channels(hex);
   const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
   const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
   const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
   return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
   ];
}

export function colorDistance(a: string, b: string): number {
   const [l1, a1, b1] = toOklab(a);
   const [l2, a2, b2] = toOklab(b);
   return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

const lightness = (hex: string): number => toOklab(hex)[0];

export const isDark = (hex: string): boolean => lightness(hex) < DARK_LIGHTNESS;

const luminance = (hex: string): number => {
   const [r, g, b] = channels(hex);
   return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function contrastRatio(a: string, b: string): number {
   const [darker, lighter] = [luminance(a), luminance(b)].toSorted((x, y) => x - y);
   return (lighter + 0.05) / (darker + 0.05);
}

export const areSimilar = (
   a: string,
   b: string,
   { cutoff, darkContrast }: Similarity = SIMILARITY,
): boolean =>
   colorDistance(a, b) < cutoff || (isDark(a) && isDark(b) && contrastRatio(a, b) < darkContrast);

// The home team keeps its first color: on a clash the away team switches to its next color that
// doesn't clash (second, then third, and so on). If away has none, home does the same. When neither
// can switch, both keep their firsts.
export function matchupColors(
   home: string[],
   away: string[],
   similarity: Similarity = SIMILARITY,
): { home: string; away: string } {
   const [home1, ...homeOthers] = home;
   const [away1, ...awayOthers] = away;
   if (!areSimilar(home1, away1, similarity)) return { home: home1, away: away1 };
   const awaySwitch = awayOthers.find((color) => !areSimilar(home1, color, similarity));
   if (awaySwitch !== undefined) return { home: home1, away: awaySwitch };
   const homeSwitch = homeOthers.find((color) => !areSimilar(color, away1, similarity));
   if (homeSwitch !== undefined) return { home: homeSwitch, away: away1 };
   return { home: home1, away: away1 };
}

const unlike = (known: string, preferred: string, other: string): string =>
   areSimilar(known, preferred) ? other : preferred;

// An unknown team takes its side's default, or the other default if that looks too much like the known team.
export function gameColors(
   home: string[] | undefined,
   away: string[] | undefined,
): { home: string; away: string } {
   const { HOME, AWAY } = DEFAULT_TEAM_COLORS;
   if (home === undefined) {
      if (away === undefined) return { home: HOME, away: AWAY };
      return { home: unlike(away[0], HOME, AWAY), away: away[0] };
   }
   if (away === undefined) return { home: home[0], away: unlike(home[0], AWAY, HOME) };
   return matchupColors(home, away);
}

export const HEADSHOT_MAX_LIGHTNESS = 0.6;

export const isLight = (background: string): boolean => lightness(background) > 0.62;

export const textColorOn = (background: string): string =>
   isLight(background) ? '#000000' : '#ffffff';

export type HeadshotShade = 'white' | 'black';

// The headshot background fades toward white, except on a light color, where it fades toward black.
export const headshotShade = (background: string): HeadshotShade =>
   lightness(background) > HEADSHOT_MAX_LIGHTNESS ? 'black' : 'white';
