import '@views/AnalysisView/AnalysisView.css';
import { useMemo } from 'react';
import PenaltyChart from '@components/PenaltyChart';
import StrengthRibbon from '@components/StrengthRibbon';
import { useGame } from '@context/useGame';
import { gameAxis } from '@layout/gameAxis';

function AnalysisView() {
   const index = useGame();
   const { game, penaltyResult } = index;
   const axis = useMemo(() => gameAxis(index, penaltyResult.timeline), [index, penaltyResult]);

   return (
      <section className="analysis">
         <h1>
            {game.awayTeam.abbrev} @ {game.homeTeam.abbrev}
         </h1>
         <div className="analysis__strip">
            <div className="analysis__strip-content">
               <PenaltyChart axis={axis} />
               <StrengthRibbon axis={axis} />
            </div>
         </div>
      </section>
   );
}

export default AnalysisView;
