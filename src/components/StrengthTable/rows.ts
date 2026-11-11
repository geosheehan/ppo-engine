export const STRENGTHS = ['5v4', '5v3', '4v3'] as const;

export const record = (goals: number, opportunities: number): string => `${goals}/${opportunities}`;
