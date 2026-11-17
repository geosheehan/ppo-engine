import type { GoalSituation } from '@engine/types';

export const EN_DASH = '\u2013';
export const SEPARATOR = '\u00B7';

export const GOAL_SITUATION_LABELS: Record<GoalSituation, string> = {
   'power-play': 'PP',
   'shorthanded': 'SH',
};

export const EVEN_STRENGTH_LABEL = 'EV';
