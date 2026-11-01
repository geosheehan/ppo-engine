import '@components/Scoreboard.css';
import { useGame } from '@context/GameContext.tsx';

type ScoreboardProps = {
   score: { away: number; home: number };
   homeOnLeft: boolean;
};

function Scoreboard({ score, homeOnLeft }: ScoreboardProps) {
   const { game } = useGame();
   const away = { abbrev: game.awayTeam.abbrev, score: score.away };
   const home = { abbrev: game.homeTeam.abbrev, score: score.home };
   const [left, right] = homeOnLeft ? [home, away] : [away, home];

   return (
      <div className="scoreboard">
         <div className="scoreboard__score">
            <span>{left.abbrev}</span>
            <strong>{left.score}</strong>
            <span className="scoreboard__dash">–</span>
            <strong>{right.score}</strong>
            <span>{right.abbrev}</span>
         </div>
      </div>
   );
};

export default Scoreboard;
