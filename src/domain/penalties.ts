import { descKeyToLabel } from '@domain/labels';

// Display names follow the NHL Official Rules 2026-27 (Reference Tables 2-8 and Rules 41-75).
export const PENALTY_DISPLAY_NAMES: Record<string, string> = {
   'charging': 'Charging',
   'cross-checking': 'Cross-checking',
   'delaying-game-puck-over-glass': 'Delay of game',
   'elbowing': 'Elbowing',
   'fighting': 'Fighting',
   'game-misconduct': 'Game misconduct',
   'high-sticking': 'High-sticking',
   'holding': 'Holding',
   'holding-the-stick': 'Holding the stick',
   'hooking': 'Hooking',
   'instigator': 'Instigator',
   'interference-goalkeeper': 'Goalkeeper interference',
   'misconduct': 'Misconduct',
   'roughing': 'Roughing',
   'slashing': 'Slashing',
   'too-many-men-on-the-ice': 'Too many men on the ice',
   'tripping': 'Tripping',

   //  // Rule book penalties not yet seen in saved games; keys follow the API's naming but are unconfirmed
   //  'abuse-of-officials': 'Abuse of officials',
   //  'boarding': 'Boarding',
   //  'broken-stick': 'Broken stick',
   //  'butt-ending': 'Butt-ending',
   //  'checking-from-behind': 'Checking from behind',
   //  'clipping': 'Clipping',
   //  'closing-hand-on-puck': 'Closing hand on puck',
   //  'delaying-game': 'Delay of game',
   //  'delaying-game-face-off-violation': 'Delay of game',
   //  'delaying-game-unsuccessful-challenge': "Delay of game",
   //  'embellishment': 'Embellishment',
   //  'head-butting': 'Head-butting',
   //  'illegal-check-to-head': 'Illegal check to the head',
   //  'illegal-equipment': 'Illegal equipment',
   //  'illegal-stick': 'Illegal stick',
   //  'interference': 'Interference',
   //  'kicking': 'Kicking',
   //  'kneeing': 'Kneeing',
   //  'match-penalty': 'Match penalty',
   //  'slew-footing': 'Slew-footing',
   //  'spearing': 'Spearing',
   //  'throwing-equipment': 'Throwing equipment',
   //  'unsportsmanlike-conduct': 'Unsportsmanlike conduct',
};

const reportedUnknownKeys = new Set<string>();

// Unknown keys fall back to the desc key as a label, and are reported once so they can be added above.
export function penaltyDisplayName(descKey: string): string {
   const name = PENALTY_DISPLAY_NAMES[descKey];
   if (name) return name;
   if (!reportedUnknownKeys.has(descKey)) {
      reportedUnknownKeys.add(descKey);
      console.error(`Unknown key: ${descKey}`);
   }
   return descKeyToLabel(descKey);
}
