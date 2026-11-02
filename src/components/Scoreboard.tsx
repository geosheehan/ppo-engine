import '@components/Scoreboard.css';
import { useGame } from '@context/GameContext.tsx';
import type { Side } from '@engine/types.ts';

type ScoreboardProps = {
   score: { away: number; home: number };
   homeOnLeft: boolean;
   scoringSide?: Side;
};

function Scoreboard({ score, homeOnLeft, scoringSide }: ScoreboardProps) {
   const { game } = useGame();
   const away = { side: 'away', abbrev: game.awayTeam.abbrev, score: score.away };
   const home = { side: 'home', abbrev: game.homeTeam.abbrev, score: score.home };
   const [left, right] = homeOnLeft ? [home, away] : [away, home];

   // Keyed by the score so the number remounts, and its pop animation replays, on every goal.
   const number = (team: typeof left) => (
      <strong key={`${team.side}-${team.score}`}className={team.side === scoringSide ? 'scoreboard__pop' : undefined}>{team.score}</strong>
   );

   return (
      <div className="scoreboard">
         <div className="scoreboard__score">
            <span>{left.abbrev}</span>
            {number(left)}
            <span className="scoreboard__dash">–</span>
            {number(right)}
            <span>{right.abbrev}</span>
         </div>
      </div>
   );
};

export default Scoreboard;
