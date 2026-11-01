export const EDGE = '#1a1a1a';

export const filled = { fill: 'currentColor', stroke: EDGE, strokeWidth: 2, strokeLinejoin: 'round', paintOrder: 'stroke' } as const;

export const edge = (width: number) => ({ fill: 'none', stroke: EDGE, strokeWidth: width });
export const team = (width: number) => ({ fill: 'none', stroke: 'currentColor', strokeWidth: width });
export const round = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
