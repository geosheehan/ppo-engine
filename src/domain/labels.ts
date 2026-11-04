import { PERIOD_TYPES, PLAY_TYPES } from '@domain/constants';
import type { Play, PlayType } from '@domain/types';

export const PLAY_TYPE_LABELS: Record<PlayType, string> = {
   [PLAY_TYPES.BLOCKED_SHOT]: 'Blocked shot',
   [PLAY_TYPES.DELAYED_PENALTY]: 'Delayed penalty',
   [PLAY_TYPES.FACEOFF]: 'Faceoff',
   [PLAY_TYPES.GAME_END]: 'Game end',
   [PLAY_TYPES.GIVEAWAY]: 'Giveaway',
   [PLAY_TYPES.GOAL]: 'Goal',
   [PLAY_TYPES.HIT]: 'Hit',
   [PLAY_TYPES.MISSED_SHOT]: 'Missed shot',
   [PLAY_TYPES.PENALTY]: 'Penalty',
   [PLAY_TYPES.PERIOD_END]: 'Period end',
   [PLAY_TYPES.PERIOD_START]: 'Period start',
   [PLAY_TYPES.SHOT_ON_GOAL]: 'Shot on goal',
   [PLAY_TYPES.STOPPAGE]: 'Stoppage',
   [PLAY_TYPES.TAKEAWAY]: 'Takeaway',
};

// An NHL API desc key in sentence case, e.g. 'some-new-penalty' -> 'Some new penalty'.
export const descKeyToLabel = (descKey: string): string => {
   const words = descKey.replaceAll('-', ' ');
   return words.charAt(0).toUpperCase() + words.slice(1);
};

// Overtimes after the first are numbered, as in playoff games: OT, 2OT, 3OT.
export const periodLabel = (period: number, regPeriods: number): string => {
   if (period <= regPeriods) return `P${period}`;
   const overtime = period - regPeriods;
   return overtime === 1 ? 'OT' : `${overtime}OT`;
};

export const playPeriodLabel = ({ periodDescriptor }: Play): string =>
   periodDescriptor.periodType === PERIOD_TYPES.SHOOTOUT
      ? PERIOD_TYPES.SHOOTOUT
      : periodLabel(periodDescriptor.number, periodDescriptor.maxRegulationPeriods);
