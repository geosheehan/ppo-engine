import './App.css';
import { useGame } from './context/GameContext.tsx';
import PenaltyTable from './components/PenaltyTable.tsx';
import type { Team } from './domain/types.ts';

function App() {
  const { game } = useGame();

  const getTeamFullName = (team: Team): string => `${team.placeName.default} ${team.commonName.default}`;

  const home = game.homeTeam;
  const away = game.awayTeam;

  return (
    <>
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
          </section>
        </div>
      </section>
    </>
  )
}

export default App
