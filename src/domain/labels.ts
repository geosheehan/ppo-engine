import type { Play } from '@domain/types';

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
   periodDescriptor.periodType === 'SO' ? 'SO' : periodLabel(periodDescriptor.number, periodDescriptor.maxRegulationPeriods);
