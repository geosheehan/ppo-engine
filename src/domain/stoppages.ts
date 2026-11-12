import { descKeyToLabel } from '@domain/labels';
import type { Side, StoppageDetails } from '@domain/types';

export const STOPPAGE_REASON_NAMES: Record<string, string> = {
   'chlg-hm-puck-over-glass': 'Home challenge: puck over the glass',
   'chlg-vis-goal-interference': 'Visitor challenge: goalkeeper interference',
   'goalie-stopped-after-sog': 'Goalkeeper froze the puck',
   'hand-pass': 'Hand pass',
   'high-stick': 'High stick',
   'home-timeout': 'Home timeout',
   'icing': 'Icing',
   'net-dislodged-by-goaltender': 'Net dislodged by the goalkeeper',
   'net-dislodged-defensive-skater': 'Net dislodged by a defending skater',
   'net-off': 'Net off its moorings',
   'offside': 'Offside',
   'player-equipment': 'Player equipment',
   'player-injury': 'Player injury',
   'puck-frozen': 'Puck frozen',
   'puck-in-benches': 'Puck in the bench',
   'puck-in-crowd': 'Puck in the crowd',
   'puck-in-netting': 'Puck in the netting',
   'puck-in-penalty-benches': 'Puck in the penalty bench',
   'referee-or-linesman': 'Referee or linesman',
   'rink-repair': 'Rink repair',
   'skater-puck-frozen': 'Puck frozen by a skater',
   'tv-timeout': 'TV timeout',
   'video-review': 'Video review',
   'visitor-timeout': 'Visitor timeout',
};

const reportedUnknownKeys = new Set<string>();

export function stoppageReasonName(reason: string): string {
   const name = STOPPAGE_REASON_NAMES[reason];
   if (name) return name;
   if (!reportedUnknownKeys.has(reason)) {
      reportedUnknownKeys.add(reason);
      console.error(`Unknown stoppage reason: ${reason}`);
   }
   return descKeyToLabel(reason);
}

const TIMEOUT_SIDES: Record<string, Side> = {
   'home-timeout': 'home',
   'visitor-timeout': 'away',
};

const REFEREE_OR_LINESMAN = 'referee-or-linesman';

const reasonName = (reason: string, abbrevs?: Record<Side, string>): string => {
   const side = TIMEOUT_SIDES[reason];
   return side !== undefined && abbrevs !== undefined
      ? `${abbrevs[side]} timeout`
      : stoppageReasonName(reason);
};

// "Referee or linesman" says nothing about why play stopped, so its secondary reason takes its place. Otherwise
// the only secondary reason worth showing is a team's timeout; a repeat of the main reason or a TV timeout is not.
export function stoppageDetail(
   { reason, secondaryReason }: StoppageDetails,
   abbrevs?: Record<Side, string>,
): string {
   if (reason === REFEREE_OR_LINESMAN) {
      return secondaryReason !== undefined ? reasonName(secondaryReason, abbrevs) : '';
   }
   const showSecondary =
      secondaryReason !== undefined
      && secondaryReason !== reason
      && TIMEOUT_SIDES[secondaryReason] !== undefined;
   return showSecondary
      ? `${reasonName(reason, abbrevs)} | ${reasonName(secondaryReason, abbrevs)}`
      : reasonName(reason, abbrevs);
}
