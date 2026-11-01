import { useMemo, useState } from 'react';
import { useGame } from '@context/GameContext.tsx';
import { isGoal, isPenalty } from '@domain/types.ts';
import { homeDefendingSides } from '@engine/defendingSide.ts';
import { byGameOrder, playTime, runPenaltyEngine } from '@engine/penaltyEngine.ts';
import { snapshotAt } from '@engine/snapshot.ts';
import { opportunityTotals } from '@engine/opportunities.ts';
import type { Side } from '@engine/types.ts';

// The state of the game at the play being replayed, and a way to move between plays.
export function useReplay() {
   const { game } = useGame();

   // Computed once per game. Nothing here changes while stepping through plays.
   const plays = useMemo(() => game.plays.toSorted(byGameOrder), [game]);
   const result = useMemo(() => runPenaltyEngine(game), [game]);
   const penaltyPlays = useMemo(() => new Map(plays.filter(isPenalty).map((play) => [play.eventId, play])), [plays]);
   const goalPlays = useMemo(() => new Map(plays.filter(isGoal).map((play) => [play.eventId, play])), [plays]);
   const defendingSides = useMemo(() => homeDefendingSides(game), [game]);

   // The only replay state: which play we're on. Everything below is derived from it.
   const [index, setIndex] = useState(0);
   const play = plays[index];
   const time = playTime(play);

   const lastGoal = plays.slice(0, index + 1).findLast(isGoal);
   const homeOnLeft = defendingSides.get(play.periodDescriptor.number) === 'left';

   return {
      play,
      index,
      setIndex,
      plays,
      snapshot: snapshotAt(result, penaltyPlays, time),
      totals: opportunityTotals(result, goalPlays, time),
      score: { away: lastGoal?.details.awayScore ?? 0, home: lastGoal?.details.homeScore ?? 0 },
      homeOnLeft,
      // Left to right, matching the ends of the rink.
      sides: (homeOnLeft ? ['home', 'away'] : ['away', 'home']) as Side[],
   };
};
