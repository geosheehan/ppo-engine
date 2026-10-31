import '@components/Scoreboard.css';
import { useGame } from '@context/GameContext.tsx';

type ScoreboardProps = {
   score: { away: number; home: number };
};

function Scoreboard({ score }: ScoreboardProps) {
   const { game } = useGame();
   const away = game.awayTeam;
   const home = game.homeTeam;

   return (
      <div className="scoreboard">
         <div className="scoreboard__score">
            <span>{away.abbrev}</span>
            <strong>{score.away}</strong>
            <span className="scoreboard__dash">–</span>
            <strong>{score.home}</strong>
            <span>{home.abbrev}</span>
         </div>
      </div>
   );
};

export default Scoreboard;
