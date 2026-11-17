import { expect } from 'vitest';
import { playerKeyOf } from '@engine/penaltyEngine';
import type { PenaltyEngineResult, ServedPenalty } from '@engine/types';
import type { GameIndex } from '@domain/types';

export type ClockClash = {
   side: string;
   player: number;
   first: ServedPenalty;
   second: ServedPenalty;
};

// A player sits in the box once, so his served pieces never overlap in time.
export function clockClashes(index: GameIndex, result: PenaltyEngineResult): ClockClash[] {
   const players = new Map(index.penalties.map((play) => [play.eventId, playerKeyOf(play)]));
   const clashes: ClockClash[] = [];
   const pieces = result.servedPenalties.filter((piece) => piece.end > piece.start);
   pieces.forEach((first, i) => {
      for (const second of pieces.slice(i + 1)) {
         const player = players.get(first.penaltyEventId);
         if (
            first.side === second.side
            && player !== undefined
            && player === players.get(second.penaltyEventId)
            && first.start < second.end
            && second.start < first.end
         )
            clashes.push({ side: first.side, player, first, second });
      }
   });
   return clashes;
}

export const expectOneClockPerPlayer = (index: GameIndex, result: PenaltyEngineResult) =>
   expect(clockClashes(index, result)).toEqual([]);
