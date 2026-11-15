import '@views/AnalysisView/AnalysisView.css';
import { useMemo } from 'react';
import PenaltyChart from '@components/PenaltyChart';
import { useGame } from '@context/useGame';
import { gameAxis } from '@layout/gameAxis';

function AnalysisView() {
   const index = useGame();
   const { game, penaltyResult } = index;
   const axis = useMemo(() => gameAxis(index, penaltyResult.timeline), [index, penaltyResult]);

   return (
      <main className="analysis">
         <h1>
            {game.awayTeam.abbrev} @ {game.homeTeam.abbrev}
         </h1>
         <PenaltyChart axis={axis} />
      </main>
   );
}

export default AnalysisView;
