import { useCallback, useMemo, useState } from 'react';
import { useGame } from '@context/useGame.ts';
import { onIceAt } from '@domain/onIce.ts';
import { delayedPenaltyCall, playTime } from '@domain/plays.ts';
import type { ReplayPosition } from '@domain/playback.ts';
import { lineChangeAt, replaySteps, stepIndexAt, teamsYetToChange } from '@domain/steps.ts';
import { isGoal, isPenalty } from '@domain/types.ts';
import { snapshotAt } from '@engine/snapshot.ts';
import { totalsAt } from '@engine/powerPlayCounter.ts';
import type { Side } from '@domain/types.ts';

// The state of the game at the play being replayed, and a way to move between plays.
export function useReplay() {
   const { game, plays, shifts, penaltyResult, powerPlays, defendingSides } = useGame();

   // Computed once per game. Nothing here changes while stepping through plays.
   const penaltyPlays = useMemo(() => new Map(plays.filter(isPenalty).map((play) => [play.eventId, play])), [plays]);
   const steps = useMemo(() => replaySteps(plays, shifts, [game.awayTeam.id, game.homeTeam.id]), [plays, shifts, game]);

   // The only replay state: which play we're on, and the game time. Between plays a live replay runs the clock on
   // from the play's time toward the next one. Everything below is derived from it.
   const [position, setPosition] = useState<ReplayPosition>(() => ({ index: 0, time: playTime(plays[0]) }));
   const { index, time } = position;
   const play = plays[index];
   const setIndex = useCallback(
      (index: number, time = playTime(plays[index]), changedTeamId?: number) => setPosition({ index, time, changedTeamId }),
      [plays],
   );

   const stepIndex = stepIndexAt(steps, position);
   const { changedTeamId } = steps[stepIndex];
   const lastGoal = plays.slice(0, index + 1).findLast(isGoal);
   const homeOnLeft = defendingSides.get(play.periodDescriptor.number) === 'left';
   const sides: [Side, Side] = homeOnLeft ? ['home', 'away'] : ['away', 'home'];

   return {
      play,
      index,
      time,
      setIndex,
      plays,
      steps,
      stepIndex,
      changedTeamId,
      lineChange: changedTeamId ? lineChangeAt(shifts, changedTeamId, steps[stepIndex].time) : undefined,
      calledPenalty: play.typeDescKey === 'delayed-penalty' ? delayedPenaltyCall(plays, index) : undefined,
      goalEffect:penaltyResult.goals.find((goal) => goal.goalEventId === play.eventId),
      snapshot: snapshotAt(penaltyResult, penaltyPlays, time),
      onIce: onIceAt(shifts, play, time, teamsYetToChange(steps, stepIndex)),
      totals: totalsAt(powerPlays, time),
      score: { away: lastGoal?.details.awayScore ?? 0, home: lastGoal?.details.homeScore ?? 0 },
      homeOnLeft,
      sides,
   };
};
