// Rink positions in feet from centre ice, on the NHL API's x/y axes.
export type RinkPoint = { x: number; y: number };

export const CENTRE_DOT: RinkPoint = { x: 0, y: 0 };

// Neutral-zone spots, 5 ft from the blue lines, 44 ft apart.
export const NEUTRAL_DOTS: RinkPoint[] = [
   { x: -20, y: -22 }, { x: -20, y: 22 }, { x: 20, y: -22 }, { x: 20, y: 22 },
];

// End-zone spots (centres of the faceoff circles), 20 ft from the goal lines, 44 ft apart.
export const END_ZONE_DOTS: RinkPoint[] = [
   { x: -69, y: -22 }, { x: -69, y: 22 }, { x: 69, y: -22 }, { x: 69, y: 22 },
];

export const FACEOFF_DOTS: RinkPoint[] = [CENTRE_DOT, ...NEUTRAL_DOTS, ...END_ZONE_DOTS];

// Faceoffs only happen on a dot, but recorded locations can be a few feet off. Snap to the closest one.
export function nearestFaceoffDot(point: RinkPoint): RinkPoint {
   const distance = (dot: RinkPoint) => Math.hypot(dot.x - point.x, dot.y - point.y);
   return FACEOFF_DOTS.reduce((nearest, dot) => (distance(dot) < distance(nearest) ? dot : nearest));
}
