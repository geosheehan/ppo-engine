import { playerKeyOf } from '@engine/penaltyEngine';
import { strengthAt } from '@engine/strength';
import type { ClockedPenalty, PenaltyEngineResult, ServedPenalty, Strength } from '@engine/types';
import { playTime } from '@domain/plays';
import type { GameElapsed, PenaltyPlay } from '@domain/types';

export type QueuedPenalty = {
   served: ServedPenalty;
   play: PenaltyPlay;
};

export type Snapshot = {
   strength: Strength;
   onClock: ClockedPenalty[];
   queued: QueuedPenalty[];
};

const fullSeconds = (served: ServedPenalty, play: PenaltyPlay): number =>
   served.doubleMinorHalf !== undefined ? 120 : play.details.duration * 60;

type CalledPiece = { served: ServedPenalty; play: PenaltyPlay; player: number; order: number };

export function snapshotAt(
   result: PenaltyEngineResult,
   penaltyPlays: Map<number, PenaltyPlay>,
   time: GameElapsed,
): Snapshot {
   const strength = strengthAt(result.timeline, time);

   const called = result.servedPenalties.flatMap((served, order) => {
      const play = penaltyPlays.get(served.penaltyEventId);
      return play && playTime(play) <= time
         ? [{ served, play, player: playerKeyOf(play), order }]
         : [];
   });
   // The piece a player serves straight after this one, on the same clock: a double minor's second half, his minor
   // after his major, or time added while he was in the box. Pieces are listed in the order they ended.
   const nextInSentence = (piece: CalledPiece) =>
      called.find(
         (next) =>
            next.player === piece.player
            && next.served.side === piece.served.side
            && next.served.penaltyClock === piece.served.penaltyClock
            && next.served.start === piece.served.end
            && next.order > piece.order,
      );

   const onClock: ClockedPenalty[] = [];
   const queued: QueuedPenalty[] = [];
   const waitingBehindOwn = new Set<CalledPiece>();
   for (const piece of called) {
      const { served, play } = piece;
      if (served.start <= time && time < served.end) {
         let remaining = served.start + fullSeconds(served, play) - time;
         for (let next = nextInSentence(piece); next; next = nextInSentence(next)) {
            remaining += fullSeconds(next.served, next.play);
         }
         onClock.push({ served, play, remaining });
      }
      const next = nextInSentence(piece);
      if (next) waitingBehindOwn.add(next);
   }
   for (const piece of called) {
      if (time < piece.served.start && !waitingBehindOwn.has(piece)) {
         queued.push({ served: piece.served, play: piece.play });
      }
   }

   return { strength, onClock, queued };
}
