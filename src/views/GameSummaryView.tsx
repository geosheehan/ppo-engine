import { useGame } from '@context/useGame';
import type { Team } from '@domain/types';
import PenaltyTable from '@components/PenaltyTable';
import PenaltyChart from '@components/PenaltyChart';

// The original App body. Its styles are still in App.css, which App imports.
function GameSummaryView() {
   const { game } = useGame();

   const getTeamFullName = (team: Team): string => `${team.placeName.default} ${team.commonName.default}`;

   const home = game.homeTeam;
   const away = game.awayTeam;

   return (
      <section id="center">
         <div>
            <h1>{getTeamFullName(away)} @ {getTeamFullName(home)}</h1>
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
               <PenaltyChart />
            </section>
         </div>
      </section>
   )
}

export default GameSummaryView
