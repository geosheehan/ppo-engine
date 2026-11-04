import '@/App.css';
import { Suspense, use } from 'react';
import ReplayView from '@views/ReplayView';
import ReplayScreen from '@views/ReplayView/ReplayScreen';
import GamePicker from '@components/GamePicker';
import { useGameId } from '@hooks/useGameId';
import GameProvider from '@context/GameProvider';
import { ppoApi } from '@api/ppoApi';

// Shows the replay for now. GameSummaryView comes back once a router can switch between views.
function App() {
   const games = use(ppoApi.listGames());
   const [gameId, selectGame] = useGameId();
   const selected = games.find((game) => game.id === gameId) ?? games.at(0);
   if (selected === undefined) return <p className="app__message">No saved games found.</p>;

   return (
      <>
         <GamePicker games={games} selectedId={selected.id} onSelect={selectGame} />
         <Suspense fallback={<ReplayScreen />}>
            <GameProvider key={selected.id} gameId={selected.id}>
               <ReplayView />
            </GameProvider>
         </Suspense>
      </>
   );
}

export default App;
