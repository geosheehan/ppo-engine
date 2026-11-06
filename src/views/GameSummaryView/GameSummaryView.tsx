import { useMemo } from 'react';
import PenaltyChart from '@components/PenaltyChart';
import PenaltyTable from '@components/PenaltyTable';
import { useGame } from '@context/useGame';
import { gameAxis } from '@layout/gameAxis';
import type { Team } from '@domain/types';

// The original App body. Its styles are still in App.css, which App imports.
function GameSummaryView() {
   const index = useGame();
   const { game, penaltyResult } = index;
   const axis = useMemo(() => gameAxis(index, penaltyResult.timeline), [index, penaltyResult]);

   const getTeamFullName = (team: Team): string =>
      `${team.placeName.default} ${team.commonName.default}`;

   const home = game.homeTeam;
   const away = game.awayTeam;

   return (
      <section id="center">
         <div>
            <h1>
               {getTeamFullName(away)} @ {getTeamFullName(home)}
            </h1>
            <section id="next-steps">
               <div id="penalties">
                  <h2>Penalty Summary</h2>
                  <div>
                     <PenaltyTable team="away" />
                  </div>
                  <div>
                     <PenaltyTable team="home" />
                  </div>
               </div>
               <PenaltyChart axis={axis} />
            </section>
         </div>
      </section>
   );
}

export default GameSummaryView;
