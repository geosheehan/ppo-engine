import { isGoal } from '@domain/plays';
import '@views/ReplayView/ReplayView.css';
import type { CSSProperties } from 'react';
import CurrentPlay from '@components/CurrentPlay';
import OnIcePanel from '@components/OnIcePanel';
import PenaltyClocks from '@components/PenaltyClocks';
import PlayMarker from '@components/PlayMarker';
import PlayParticipants from '@components/PlayParticipants';
import ReplayControls from '@components/ReplayControls';
import Rink from '@components/Rink';
import Scoreboard from '@components/Scoreboard';
import ShotLine from '@components/ShotLine';
import StrengthTable from '@components/StrengthTable';
import { useReplay } from '@hooks/useReplay';
import { useGame } from '@context/useGame';

function ReplayView() {
   const { game, colors, sideOf } = useGame();
   const {
      play,
      index,
      time,
      setPosition,
      plays,
      steps,
      stepIndex,
      changedTeamId,
      lineChange,
      calledPenalty,
      goalEffect,
      snapshot,
      onIce,
      totals,
      score,
      homeOnLeft,
      sides,
   } = useReplay();
   const isLineChange = changedTeamId !== undefined;

   const [left, right] = sides;
   const endColors = {
      '--left-end-color': colors[left],
      '--right-end-color': colors[right],
   } as CSSProperties;
   // A power-play goal ends the penalty in the same second, so the snapshot already shows the strength after the
   // goal. Show the strength it was scored at until the next play.
   const liveStrength = goalEffect?.strength ?? snapshot.strength;
   const scoringSide =
      isGoal(play) && !isLineChange ? sideOf(play.details.eventOwnerTeamId) : undefined;
   const shotLocated =
      isGoal(play) && play.details.xCoord !== undefined && play.details.yCoord !== undefined;

   return (
      <section className="replay" style={endColors}>
         <title>{`${game.awayTeam.abbrev} @ ${game.homeTeam.abbrev}`}</title>
         <header className="replay__header">
            <Scoreboard
               play={play}
               time={time}
               score={score}
               homeOnLeft={homeOnLeft}
               scoringSide={scoringSide}
            />
            <CurrentPlay play={play} goalEffect={goalEffect} changedTeamId={changedTeamId} />
         </header>
         <PlayParticipants
            play={isLineChange ? undefined : play}
            lineChange={lineChange}
            sides={sides}
         />
         <div className="replay__stage">
            <div className="replay__ice">
               <OnIcePanel key={left} side={left} onIce={onIce} position="left" />
               <div className="replay__center">
                  <Rink className="replay__rink">
                     {!isLineChange
                        && (shotLocated ? (
                           <ShotLine
                              key={play.eventId}
                              play={play}
                              homeOnLeft={homeOnLeft}
                              className="replay__icon"
                           />
                        ) : (
                           <PlayMarker
                              play={play}
                              locatedBy={calledPenalty}
                              className="replay__icon"
                           />
                        ))}
                  </Rink>
                  <div className="replay__clocks">
                     {sides.map((side, i) => (
                        <PenaltyClocks
                           key={side}
                           side={side}
                           onClock={snapshot.onClock}
                           position={i === 0 ? 'left' : 'right'}
                        />
                     ))}
                  </div>
               </div>
               <OnIcePanel key={right} side={right} onIce={onIce} position="right" />
            </div>
         </div>
         <ReplayControls
            index={index}
            time={time}
            plays={plays}
            steps={steps}
            stepIndex={stepIndex}
            onChange={setPosition}
         />
         <div className="replay__clocks">
            {sides.map((side, i) => (
               <StrengthTable
                  key={side}
                  side={side}
                  totals={totals[side]}
                  strength={liveStrength}
                  position={i === 0 ? 'left' : 'right'}
               />
            ))}
         </div>
      </section>
   );
}

export default ReplayView;
