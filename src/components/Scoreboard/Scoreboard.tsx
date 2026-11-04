import '@components/Scoreboard/Scoreboard.css';
import { clsx } from 'clsx';
import TeamChip from '@components/TeamChip';
import { secondsToClock } from '@domain/clock';
import { PERIOD_SECONDS, SIDES } from '@domain/constants';
import { playPeriodLabel } from '@domain/labels';
import { periodTimeLeft } from '@domain/plays';
import type { GameElapsed, Play, Side } from '@domain/types';

type ScoreboardProps = {
   play?: Play;
   time?: GameElapsed;
   score?: { away: number; home: number };
   teamIds?: { away: number; home: number };
   homeOnLeft?: boolean;
   scoringSide?: Side;
};

const NO_SCORE = { away: 0, home: 0 };
const START_CLOCK = `P1 ${secondsToClock(PERIOD_SECONDS)}`;

function Scoreboard({
   play,
   time = 0,
   score = NO_SCORE,
   teamIds,
   homeOnLeft = false,
   scoringSide,
}: ScoreboardProps) {
   const away = { side: SIDES.AWAY, teamId: teamIds?.away, score: score.away };
   const home = { side: SIDES.HOME, teamId: teamIds?.home, score: score.home };
   const [left, right] = homeOnLeft ? [home, away] : [away, home];

   // Keyed by the score so the number remounts, and its pop animation replays, on every goal.
   const number = (team: typeof left) => (
      <strong
         key={`${team.side}-${team.score}`}
         className={clsx(team.side === scoringSide && 'scoreboard__pop')}
      >
         {team.score}
      </strong>
   );

   return (
      <div className="scoreboard">
         <div className="scoreboard__score">
            {left.teamId !== undefined && <TeamChip teamId={left.teamId} />}
            {number(left)}
            <span className="scoreboard__clock">
               {play
                  ? `${playPeriodLabel(play)} ${secondsToClock(periodTimeLeft(play, time))}`
                  : START_CLOCK}
            </span>
            {number(right)}
            {right.teamId !== undefined && <TeamChip teamId={right.teamId} />}
         </div>
      </div>
   );
}

export default Scoreboard;
