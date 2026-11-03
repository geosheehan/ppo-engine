import { useCallback, useMemo, useState } from 'react';
import { useGame } from '@context/useGame.ts';
import { onIceAt } from '@domain/onIce.ts';
import { delayedPenaltyCall, playTime, runningScores } from '@domain/plays.ts';
import type { ReplayPosition } from '@domain/playback.ts';
import { lineChangeAt, replaySteps, stepIndexAt, teamsYetToChange } from '@domain/steps.ts';
import { isPenalty } from '@domain/types.ts';
import { snapshotAt } from '@engine/snapshot.ts';
import { totalsAt } from '@engine/powerPlayCounter.ts';
import type { Side } from '@domain/types.ts';

// The state of the game at the play being replayed, and a way to move between plays.
export function useReplay() {
   const { game, plays, shifts, onIceIndex, penaltyResult, powerPlays, defendingSides } = useGame();

   // Computed once per game. Nothing here changes while stepping through plays.
   const penaltyPlays = useMemo(() => new Map(plays.filter(isPenalty).map((play) => [play.eventId, play])), [plays]);
   const goalEffects = useMemo(() => new Map(penaltyResult.goals.map((goal) => [goal.goalEventId, goal])), [penaltyResult]);
   const scores = useMemo(() => runningScores(plays), [plays]);
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
      lineChange: changedTeamId ? lineChangeAt(onIceIndex, changedTeamId, steps[stepIndex].time) : undefined,
      calledPenalty: play.typeDescKey === 'delayed-penalty' ? delayedPenaltyCall(plays, index) : undefined,
      goalEffect: goalEffects.get(play.eventId),
      snapshot: snapshotAt(penaltyResult, penaltyPlays, time),
      onIce: onIceAt(onIceIndex, play, time, teamsYetToChange(steps, stepIndex)),
      totals: totalsAt(powerPlays, time),
      score: scores[index],
      homeOnLeft,
      sides,
   };
};
