// Rink positions in feet from center ice, on the NHL API's x/y axes.
export type RinkPoint = { x: number; y: number };

export const CENTER_DOT: RinkPoint = { x: 0, y: 0 };

// Neutral-zone spots, 5 ft from the blue lines, 44 ft apart.
export const NEUTRAL_DOTS: RinkPoint[] = [
   { x: -20, y: -22 },
   { x: -20, y: 22 },
   { x: 20, y: -22 },
   { x: 20, y: 22 },
];

// End-zone spots (centers of the faceoff circles), 20 ft from the goal lines, 44 ft apart.
export const END_ZONE_DOTS: RinkPoint[] = [
   { x: -69, y: -22 },
   { x: -69, y: 22 },
   { x: 69, y: -22 },
   { x: 69, y: 22 },
];

export const FACEOFF_DOTS: RinkPoint[] = [CENTER_DOT, ...NEUTRAL_DOTS, ...END_ZONE_DOTS];

// The middle of each net's mouth, on the goal lines 11 ft from the end boards.
export const NETS = {
   left: { x: -89, y: 0 },
   right: { x: 89, y: 0 },
} satisfies Record<string, RinkPoint>;

// Each team shoots at the net the other team defends.
export const attackedNet = (homeShooting: boolean, homeOnLeft: boolean): RinkPoint =>
   homeShooting === homeOnLeft ? NETS.right : NETS.left;

// The ice is 200 x 85 ft with 28 ft rounded corners. Inset a rectangle 28 ft from the boards on every side:
// its corners are the centers of the rounded corners, so the ice is exactly every point within 28 ft of it.
export const CORNER_RADIUS = 28;
const INNER_X = 100 - CORNER_RADIUS;
const INNER_Y = 42.5 - CORNER_RADIUS;

const clamp = (value: number, limit: number): number => Math.max(-limit, Math.min(limit, value));

// Events placed in a hurry can land past the boards. Measure from the closest point of the inner rectangle;
// anything further than 28 ft is pulled back along that line to 28 ft, onto the boards.
export function boundToIce(point: RinkPoint): RinkPoint {
   const inner = { x: clamp(point.x, INNER_X), y: clamp(point.y, INNER_Y) };
   const distance = Math.hypot(point.x - inner.x, point.y - inner.y);
   if (distance <= CORNER_RADIUS) return point;
   const scale = CORNER_RADIUS / distance;
   return { x: inner.x + (point.x - inner.x) * scale, y: inner.y + (point.y - inner.y) * scale };
}

// Faceoffs only happen on a dot, but recorded locations can be a few feet off. Snap to the closest one.
export function nearestFaceoffDot(point: RinkPoint): RinkPoint {
   const distance = (dot: RinkPoint) => Math.hypot(dot.x - point.x, dot.y - point.y);
   return FACEOFF_DOTS.reduce((nearest, dot) =>
      distance(dot) < distance(nearest) ? dot : nearest,
   );
}
