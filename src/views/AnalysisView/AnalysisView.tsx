import { useGame } from '@context/useGame';

function AnalysisView() {
   const { game } = useGame();

   return (
      <section className="analysis">
         <h1>
            {game.awayTeam.abbrev} @ {game.homeTeam.abbrev}
         </h1>
      </section>
   );
}

export default AnalysisView;
