import '@views/ReplayView.css';
import type { CSSProperties } from 'react';
import { useGame } from '@context/GameContext.tsx';
import { isGoal } from '@domain/types.ts';
import type { Team } from '@domain/types.ts';
import { useReplay } from '@views/useReplay.ts';
import CurrentPlay from '@components/CurrentPlay.tsx';
import PenaltyClocks from '@components/PenaltyClocks.tsx';
import PlayParticipants from '@components/PlayParticipants.tsx';
import PlayMarker from '@components/PlayMarker.tsx';
import ReplayControls from '@components/ReplayControls.tsx';
import Rink from '@components/Rink.tsx';
import Scoreboard from '@components/Scoreboard.tsx';
import ShotLine from '@components/ShotLine.tsx';
import StrengthTable from '@components/StrengthTable.tsx';

const teamFullName = (team: Team): string => `${team.placeName.default} ${team.commonName.default}`.toUpperCase();

function ReplayView() {
   const { game, colors } = useGame();
   const { play, index, setIndex, plays, calledPenalty, goalEffect, snapshot, totals, score, homeOnLeft, sides } = useReplay();

   const [left, right] = sides;
   const endColors = { '--left-end-color': colors[left], '--right-end-color': colors[right] } as CSSProperties;
   // A power-play goal ends the penalty in the same second, so the snapshot already shows the strength after the
   // goal. Show the strength it was scored at until the next play.
   const liveStrength = goalEffect?.strength ?? snapshot.strength;
   const scoringSide =isGoal(play) ? (play.details.eventOwnerTeamId === game.homeTeam.id ? 'home' : 'away') : undefined;

   return (
      <section className="replay" style={endColors}>
         <span className="replay__title">{teamFullName(game.awayTeam)} @ {teamFullName(game.homeTeam)}</span>
         <Scoreboard score={score} homeOnLeft={homeOnLeft} scoringSide={scoringSide} />
         <CurrentPlay play={play} goalEffect={goalEffect} />
         <PlayParticipants play={play} sides={sides} />
         <Rink className="replay__rink">
            <ShotLine play={play} homeOnLeft={homeOnLeft} />
            <PlayMarker play={play} locatedBy={calledPenalty}className="replay__icon" />
         </Rink>
         <div className="replay__clocks">
            {sides.map((side, i) => (
               <PenaltyClocks key={side} side={side} onClock={snapshot.onClock} position={i === 0 ? 'left' : 'right'} />
            ))}
         </div>
         <ReplayControls index={index} plays={plays} onChange={setIndex} />
         <div className="replay__clocks">
            {sides.map((side) => (
               <StrengthTable key={side} side={side} totals={totals[side]} strength={liveStrength} />
            ))}
         </div>
      </section>
   );
};

export default ReplayView;
