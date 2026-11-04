import '@components/Scoreboard.css';
import { clsx } from 'clsx';
import TeamChip from '@components/TeamChip';
import { useGame } from '@context/useGame';
import { secondsToClock } from '@domain/clock';
import { SIDES } from '@domain/constants';
import { playPeriodLabel } from '@domain/labels';
import { periodTimeLeft } from '@domain/plays';
import type { GameElapsed, Play, Side } from '@domain/types';

type ScoreboardProps = {
   play: Play;
   time: GameElapsed;
   score: { away: number; home: number };
   homeOnLeft: boolean;
   scoringSide?: Side;
};

function Scoreboard({ play, time, score, homeOnLeft, scoringSide }: ScoreboardProps) {
   const { game } = useGame();
   const away = { side: SIDES.AWAY, teamId: game.awayTeam.id, score: score.away };
   const home = { side: SIDES.HOME, teamId: game.homeTeam.id, score: score.home };
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
            <TeamChip teamId={left.teamId} />
            {number(left)}
            <span className="scoreboard__clock">
               {playPeriodLabel(play)} {secondsToClock(periodTimeLeft(play, time))}
            </span>
            {number(right)}
            <TeamChip teamId={right.teamId} />
         </div>
      </div>
   );
}

export default Scoreboard;
