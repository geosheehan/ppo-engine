export const EVENT_TYPES: string[] = [
   'blocked-shot',
   'delayed-penalty',
   'faceoff',
   'giveaway',
   'goal',
   'hit',
   'missed-shot',
   'penalty',
   'period-end',
   'period-start',
   'shot-on-goal',
   'stoppage',
   'takeaway',
];

export const playTypeLabel = (typeDescKey: string): string => {
   const words = typeDescKey.replaceAll('-', ' ');
   return words.charAt(0).toUpperCase() + words.slice(1);
};
