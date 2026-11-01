import '@views/ReplayView.css';
import type { CSSProperties } from 'react';
import { useGame } from '@context/GameContext.tsx';
import type { Team } from '@domain/types.ts';
import { useReplay } from '@views/useReplay.ts';
import CurrentPlay from '@components/CurrentPlay.tsx';
import PenaltyClocks from '@components/PenaltyClocks.tsx';
import PlayParticipants from '@components/PlayParticipants.tsx';
import PlayMarker from '@components/PlayMarker.tsx';
import ReplayControls from '@components/ReplayControls.tsx';
import Rink from '@components/Rink.tsx';
import Scoreboard from '@components/Scoreboard.tsx';
import StrengthTable from '@components/StrengthTable.tsx';

const teamFullName = (team: Team): string => `${team.placeName.default} ${team.commonName.default}`.toUpperCase();

function ReplayView() {
   const { game, colors } = useGame();
   const { play, index, setIndex, count, snapshot, totals, score, homeOnLeft, sides } = useReplay();

   const [left, right] = sides;
   const endColors = { '--left-end-color': colors[left], '--right-end-color': colors[right] } as CSSProperties;

   return (
      <section className="replay" style={endColors}>
         <span className="replay__title">{teamFullName(game.awayTeam)} @ {teamFullName(game.homeTeam)}</span>
         <Scoreboard score={score} homeOnLeft={homeOnLeft} />
         <CurrentPlay play={play} />
         <PlayParticipants play={play} />
         <Rink className="replay__rink">
            <PlayMarker play={play} className="replay__icon" />
         </Rink>
         <div className="replay__clocks">
            {sides.map((side, i) => (
               <PenaltyClocks key={side} side={side} onClock={snapshot.onClock} position={i === 0 ? 'left' : 'right'} />
            ))}
         </div>
         <ReplayControls index={index} count={count} onChange={setIndex} />
         <div className="replay__clocks">
            {sides.map((side) => (
               <StrengthTable key={side} side={side} totals={totals[side]} />
            ))}
         </div>
      </section>
   );
};

export default ReplayView;
