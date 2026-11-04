import { useMemo, useState } from 'react';
import { useGame } from '@context/useGame';
import { playParticipantLayout } from '@layout/participantLayout';
import { totalsAt } from '@engine/powerPlayCounter';
import { snapshotAt } from '@engine/snapshot';
import { DEFENDING_SIDES, PLAY_TYPES, SIDES } from '@domain/constants';
import { onIceAt } from '@domain/onIce';
import {
   delayedPenaltyCall,
   featuredPlayerId,
   isPenalty,
   playTime,
   runningScores,
} from '@domain/plays';
import { lineChangeAt, replaySteps, stepIndexAt, teamsYetToChange } from '@domain/steps';
import type { Player, ReplayPosition, Side } from '@domain/types';

// The state of the game at the play being replayed, and a way to move between plays.
export function useReplay() {
   const {
      game,
      plays,
      shifts,
      onIceIndex,
      penaltyResult,
      powerPlays,
      defendingSides,
      playerById,
      teamById,
      teamByHomeOrAway,
      sideOf,
      teamColor,
   } = useGame();

   // Computed once per game. Nothing here changes while stepping through plays.
   const penaltyPlays = useMemo(
      () => new Map(plays.filter(isPenalty).map((play) => [play.eventId, play])),
      [plays],
   );
   const goalEffects = useMemo(
      () => new Map(penaltyResult.goals.map((goal) => [goal.goalEventId, goal])),
      [penaltyResult],
   );
   const scores = useMemo(() => runningScores(plays), [plays]);
   const steps = useMemo(
      () => replaySteps(plays, shifts, [game.awayTeam.id, game.homeTeam.id]),
      [plays, shifts, game],
   );

   // The only replay state: which play we're on, and the game time. Between plays a live replay runs the clock on
   // from the play's time toward the next one. Everything below is derived from it.
   const [position, setPosition] = useState<ReplayPosition>(() => ({
      index: 0,
      time: playTime(plays[0]),
   }));
   const { index, time } = position;
   const play = plays[index];

   const stepIndex = stepIndexAt(steps, position);
   const { changedTeamId } = steps[stepIndex];
   const homeOnLeft = defendingSides.get(play.periodDescriptor.number) === DEFENDING_SIDES.LEFT;
   const sides: [Side, Side] = homeOnLeft ? [SIDES.HOME, SIDES.AWAY] : [SIDES.AWAY, SIDES.HOME];

   const lineChange =
      changedTeamId !== undefined
         ? lineChangeAt(onIceIndex, changedTeamId, steps[stepIndex].time)
         : undefined;
   const onIce = onIceAt(onIceIndex, play, time, teamsYetToChange(steps, stepIndex));
   const onIcePlayers = (side: Side): Player[] => {
      const { id } = teamByHomeOrAway(side);
      return onIce
         .filter(({ teamId }) => teamId === id)
         .flatMap(({ playerId }) => playerById(playerId) ?? []);
   };
   const featuredId = featuredPlayerId(play);

   return {
      play,
      index,
      time,
      setPosition,
      plays,
      steps,
      stepIndex,
      changedTeamId,
      participants: playParticipantLayout(
         { playerById, teamById, sideOf, teamColor },
         play,
         lineChange,
         sides,
      ),
      featuredPlayer: featuredId !== undefined ? playerById(featuredId) : undefined,
      calledPenalty:
         play.typeDescKey === PLAY_TYPES.DELAYED_PENALTY
            ? delayedPenaltyCall(plays, index)
            : undefined,
      goalEffect: goalEffects.get(play.eventId),
      snapshot: snapshotAt(penaltyResult, penaltyPlays, time),
      onIcePlayers: { away: onIcePlayers(SIDES.AWAY), home: onIcePlayers(SIDES.HOME) },
      totals: totalsAt(powerPlays, time),
      score: scores[index],
      homeOnLeft,
      sides,
   };
}
