import '@components/Scoreboard.css';
import { useGame } from '@context/GameContext.tsx';
import { periodLabel } from '@domain/plays.ts';
import type { Play } from '@domain/types.ts';
import type { Side } from '@engine/types.ts';
import TeamChip from '@components/TeamChip.tsx';

type ScoreboardProps = {
   play: Play;
   score: { away: number; home: number };
   homeOnLeft: boolean;
   scoringSide?: Side;
};

function Scoreboard({ play, score, homeOnLeft, scoringSide }: ScoreboardProps) {
   const { game } = useGame();
   const away = { side: 'away', teamId: game.awayTeam.id, score: score.away };
   const home = { side: 'home', teamId: game.homeTeam.id, score: score.home };
   const [left, right] = homeOnLeft ? [home, away] : [away, home];

   // Keyed by the score so the number remounts, and its pop animation replays, on every goal.
   const number = (team: typeof left) => (
      <strong key={`${team.side}-${team.score}`}className={team.side === scoringSide ? 'scoreboard__pop' : undefined}>{team.score}</strong>
   );

   return (
      <div className="scoreboard">
         <div className="scoreboard__score">
            <TeamChip teamId={left.teamId} />
            {number(left)}
            <span className="scoreboard__clock">{periodLabel(play)} {play.timeInPeriod}</span>
            {number(right)}
            <TeamChip teamId={right.teamId} />
         </div>
      </div>
   );
};

export default Scoreboard;
