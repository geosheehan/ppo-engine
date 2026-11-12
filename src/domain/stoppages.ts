import { descKeyToLabel } from '@domain/labels';
import type { Side, StoppageDetails } from '@domain/types';

export const STOPPAGE_REASON_NAMES: Record<string, string> = {
   'chlg-hm-puck-over-glass': 'Home Challenge: Puck over the glass',
   'chlg-vis-goal-interference': 'Visitor Challenge: Goalkeeper interference',
   'goalie-stopped-after-sog': 'Goalkeeper froze the puck',
   'hand-pass': 'Hand pass',
   'high-stick': 'High-sticking the puck',
   'home-timeout': 'Home time-out',
   'icing': 'Icing',
   'net-dislodged-by-goaltender': 'Net dislodged by the goalkeeper',
   'net-dislodged-defensive-skater': 'Net dislodged by a defending skater',
   'net-off': 'Net dislodged',
   'offside': 'Off-side',
   'player-equipment': 'Equipment adjustment',
   'player-injury': 'Injured player',
   'puck-frozen': 'Puck frozen',
   'puck-in-benches': 'Puck in the bench',
   'puck-in-crowd': 'Puck out of bounds',
   'puck-in-netting': 'Puck in the netting',
   'puck-in-penalty-benches': 'Puck in the penalty bench',
   'referee-or-linesman': 'Referee or linesman',
   'rink-repair': 'Rink repair',
   'skater-puck-frozen': 'Puck frozen by a skater',
   'tv-timeout': 'TV time-out',
   'video-review': 'Video review',
   'visitor-timeout': 'Visitor time-out',
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

const TEAM_REASONS: Record<string, { side: Side; name: string }> = {
   'chlg-hm-puck-over-glass': { side: 'home', name: 'Challenge: Puck over the glass' },
   'chlg-vis-goal-interference': { side: 'away', name: 'Challenge: Goalkeeper interference' },
   'home-timeout': { side: 'home', name: 'time-out' },
   'visitor-timeout': { side: 'away', name: 'time-out' },
};

const TEAM_TIMEOUTS = new Set(['home-timeout', 'visitor-timeout']);

const REFEREE_OR_LINESMAN = 'referee-or-linesman';

const reasonName = (reason: string, abbrevs?: Record<Side, string>): string => {
   const team = TEAM_REASONS[reason];
   return team !== undefined && abbrevs !== undefined
      ? `${abbrevs[team.side]} ${team.name}`
      : stoppageReasonName(reason);
};

// "Referee or linesman" says nothing about why play stopped, so its secondary reason takes its place. Otherwise
// the only secondary reason worth showing is a team's time-out; a repeat of the main reason or a TV time-out is
// not.
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
      && TEAM_TIMEOUTS.has(secondaryReason);
   return showSecondary
      ? `${reasonName(reason, abbrevs)} | ${reasonName(secondaryReason, abbrevs)}`
      : reasonName(reason, abbrevs);
}
