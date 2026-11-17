import type {
   Assessment,
   CalledPenalty,
   OffsetPenalty,
   PenaltyKind,
   Sentence,
   TimedPenalty,
} from '@engine/types';
import { PENALTY_SEVERITIES, SIDES } from '@domain/constants';
import type { Side } from '@domain/types';

export function toTimedPenalties(called: CalledPenalty): TimedPenalty[] {
   if (
      called.severity === PENALTY_SEVERITIES.MAJOR
      || called.severity === PENALTY_SEVERITIES.MATCH
   ) {
      return [
         {
            eventId: called.eventId,
            kind: 'major',
            seconds: called.minutes * 60,
            coincidental: false,
         },
      ];
   }
   if (called.minutes === 4) {
      const halves: TimedPenalty[] = [
         {
            eventId: called.eventId,
            kind: 'minor',
            seconds: 120,
            doubleMinorHalf: 1,
            coincidental: false,
         },
         {
            eventId: called.eventId,
            kind: 'minor',
            seconds: 120,
            doubleMinorHalf: 2,
            coincidental: false,
         },
      ];
      return called.doubleMinorFirstHalfWashed ? halves.slice(1) : halves;
   }
   return [
      { eventId: called.eventId, kind: 'minor', seconds: called.minutes * 60, coincidental: false },
   ];
}

// Rule 19: one minor each with nothing else on the clocks is served 4-on-4;
// otherwise equal numbers of minors and majors cancel and only the difference is served.
export function assessPenalties(called: CalledPenalty[], penaltiesInEffect: boolean): Assessment {
   const away = called.filter((calledPenalty) => calledPenalty.side === SIDES.AWAY);
   const home = called.filter((calledPenalty) => calledPenalty.side === SIDES.HOME);

   const isSingleMinor = (calledPenalty: CalledPenalty) => {
      const timed = toTimedPenalties(calledPenalty);
      return timed.length === 1 && timed[0].kind === 'minor';
   };
   if (
      !penaltiesInEffect
      && away.length === 1
      && home.length === 1
      && isSingleMinor(away[0])
      && isSingleMinor(home[0])
   ) {
      const sentences = [away[0], home[0]].map((calledPenalty) => ({
         side: calledPenalty.side,
         playerKey: calledPenalty.playerKey,
         penalties: toTimedPenalties(calledPenalty).map((penalty) => ({
            ...penalty,
            coincidental: true,
         })),
      }));
      return { sentences, offset: [] };
   }

   const toOwned = (calledPenalty: CalledPenalty): OwnedPenalty[] =>
      toTimedPenalties(calledPenalty).map((penalty) => ({
         penalty,
         playerKey: calledPenalty.playerKey,
      }));
   const awayPenalties = away.flatMap(toOwned);
   const homePenalties = home.flatMap(toOwned);

   const offset: OffsetPenalty[] = [];
   let majorsCancelled = false;
   for (const kind of ['major', 'minor'] as const) {
      const cancelled = Math.min(
         countOfPenaltyKind(awayPenalties, kind),
         countOfPenaltyKind(homePenalties, kind),
      );
      const awayCancelled = cancelPenalties(awayPenalties, kind, cancelled);
      const homeCancelled = cancelPenalties(homePenalties, kind, cancelled);
      awayCancelled.forEach((penalty, i) =>
         offset.push({ side: SIDES.AWAY, penalty, by: homeCancelled[i] }),
      );
      homeCancelled.forEach((penalty, i) =>
         offset.push({ side: SIDES.HOME, penalty, by: awayCancelled[i] }),
      );
      if (kind === 'major' && cancelled > 0) majorsCancelled = true;
   }

   const sentences = [
      ...toSentences(SIDES.AWAY, awayPenalties, majorsCancelled),
      ...toSentences(SIDES.HOME, homePenalties, majorsCancelled),
   ];
   return { sentences, offset };
}

type OwnedPenalty = { penalty: TimedPenalty; playerKey: number };

const countOfPenaltyKind = (penalties: OwnedPenalty[], kind: PenaltyKind) =>
   penalties.filter((owned) => owned.penalty.kind === kind).length;

function cancelPenalties(
   penalties: OwnedPenalty[],
   kind: PenaltyKind,
   count: number,
): TimedPenalty[] {
   const cancelled: TimedPenalty[] = [];
   for (let i = penalties.length - 1; i >= 0 && cancelled.length < count; i--) {
      if (penalties[i].penalty.kind === kind) cancelled.push(penalties.splice(i, 1)[0].penalty);
   }
   return cancelled;
}

// Rule 20.1: a player's major is served before his minor, unless coincidental majors were called.
// Rule 26.3: across different players, the minor is recorded first.
function toSentences(side: Side, penalties: OwnedPenalty[], majorsCancelled: boolean): Sentence[] {
   const firstKind: PenaltyKind = majorsCancelled ? 'minor' : 'major';
   const byPlayer = new Map<number, TimedPenalty[]>();
   for (const { penalty, playerKey } of penalties) {
      byPlayer.set(playerKey, [...(byPlayer.get(playerKey) ?? []), penalty]);
   }

   const sentences = [...byPlayer].map(([playerKey, playerPenalties]): Sentence => ({
      side,
      playerKey,
      penalties: [
         ...playerPenalties.filter((penalty) => penalty.kind === firstKind),
         ...playerPenalties.filter((penalty) => penalty.kind !== firstKind),
      ],
   }));
   return sentences.sort(
      (a, b) => Number(a.penalties[0].kind === 'major') - Number(b.penalties[0].kind === 'major'),
   );
}
