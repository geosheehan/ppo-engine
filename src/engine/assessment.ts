import type { PenaltySeverity, Side } from '@domain/types';
import type { PenaltyKind } from '@engine/types';


export type CalledPenalty = {
   eventId: number;
   side: Side;
   playerKey: number;
   severity: PenaltySeverity;
   minutes: number;
   doubleMinorFirstHalfWashed: boolean;
};

export type TimedPenalty = {
   eventId: number;
   kind: PenaltyKind;
   seconds: number;
   doubleMinorHalf?: 1 | 2;
};

export type Sentence = {
   side: Side;
   penalties: TimedPenalty[];
   coincidental: boolean;
};

export const STRENGTH_SEVERITIES = new Set<PenaltySeverity>(['MIN', 'BEN', 'MAJ', 'MAT']);

export function toTimedPenalties(called: CalledPenalty): TimedPenalty[] {
   if (called.severity === 'MAJ' || called.severity === 'MAT') {
      return [{ eventId: called.eventId, kind: 'major', seconds: called.minutes * 60 }];
   }
   if (called.minutes === 4) {
      const halves: TimedPenalty[] = [
         { eventId: called.eventId, kind: 'minor', seconds: 120, doubleMinorHalf: 1 },
         { eventId: called.eventId, kind: 'minor', seconds: 120, doubleMinorHalf: 2 },
      ];
      return called.doubleMinorFirstHalfWashed ? halves.slice(1) : halves;
   }
   return [{ eventId: called.eventId, kind: 'minor', seconds: called.minutes * 60 }];
}

// Rule 19: one minor each with nothing else on the clocks is served 4-on-4;
// otherwise equal numbers of minors and majors cancel and only the difference is served.
export function assessPenalties(called: CalledPenalty[], penaltiesInEffect: boolean): Sentence[] {
   const away = called.filter((calledPenalty) => calledPenalty.side === 'away');
   const home = called.filter((calledPenalty) => calledPenalty.side === 'home');

   const isSingleMinor = (calledPenalty: CalledPenalty) => {
      const timed = toTimedPenalties(calledPenalty);
      return timed.length === 1 && timed[0].kind === 'minor';
   };
   if (!penaltiesInEffect && away.length === 1 && home.length === 1 && isSingleMinor(away[0]) && isSingleMinor(home[0])) {
      return [away[0], home[0]].map((calledPenalty) => ({ side: calledPenalty.side, penalties: toTimedPenalties(calledPenalty), coincidental: true }));
   }

   const toOwned = (calledPenalty: CalledPenalty): OwnedPenalty[] =>
      toTimedPenalties(calledPenalty).map((penalty) => ({ penalty, playerKey: calledPenalty.playerKey }));
   const awayPenalties = away.flatMap(toOwned);
   const homePenalties = home.flatMap(toOwned);

   let majorsCancelled = false;
   for (const kind of ['major', 'minor'] as const) {
      const cancelled = Math.min(countOfPenaltyKind(awayPenalties, kind), countOfPenaltyKind(homePenalties, kind));
      cancelPenalties(awayPenalties, kind, cancelled);
      cancelPenalties(homePenalties, kind, cancelled);
      if (kind === 'major' && cancelled > 0) majorsCancelled = true;
   }

   return [
      ...toSentences('away', awayPenalties, majorsCancelled),
      ...toSentences('home', homePenalties, majorsCancelled),
   ];
}

type OwnedPenalty = { penalty: TimedPenalty; playerKey: number };

const countOfPenaltyKind = (penalties: OwnedPenalty[], kind: PenaltyKind) =>
   penalties.filter((owned) => owned.penalty.kind === kind).length;

function cancelPenalties(penalties: OwnedPenalty[], kind: PenaltyKind, count: number): void {
   for (let i = penalties.length - 1; i >= 0 && count > 0; i--) {
      if (penalties[i].penalty.kind === kind) {
         penalties.splice(i, 1);
         count--;
      }
   }
}

// Rule 20.1: a player's major is served before his minor, unless coincidental majors were called.
// Rule 26.3: across different players, the minor is recorded first.
function toSentences(side: Side, penalties: OwnedPenalty[], majorsCancelled: boolean): Sentence[] {
   const firstKind: PenaltyKind = majorsCancelled ? 'minor' : 'major';
   const byPlayer = new Map<number, TimedPenalty[]>();
   for (const { penalty, playerKey } of penalties) {
      byPlayer.set(playerKey, [...(byPlayer.get(playerKey) ?? []), penalty]);
   }

   const sentences = [...byPlayer.values()].map((playerPenalties): Sentence => ({
      side,
      penalties: [
         ...playerPenalties.filter((penalty) => penalty.kind === firstKind),
         ...playerPenalties.filter((penalty) => penalty.kind !== firstKind),
      ],
      coincidental: false,
   }));
   return sentences.sort((a, b) => Number(a.penalties[0].kind === 'major') - Number(b.penalties[0].kind === 'major'));
}
