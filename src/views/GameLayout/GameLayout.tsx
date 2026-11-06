import { Suspense, use } from 'react';
import { Navigate, Outlet, useMatch, useNavigate, useParams } from 'react-router';
import ReplayScreen from '@views/ReplayView/ReplayScreen';
import GameNav from '@components/GameNav';
import GamePicker from '@components/GamePicker';
import GameProvider from '@context/GameProvider';
import { ppoApi } from '@api/ppoApi';
import { GAME_VIEW_PATTERN, GAME_VIEWS, gamePath, isGameView } from '@layout/routes';

function GameLayout() {
   const games = use(ppoApi.listGames());
   const { gameId } = useParams();
   const viewParam = useMatch(GAME_VIEW_PATTERN)?.params.view;
   const view = isGameView(viewParam) ? viewParam : undefined;
   const navigate = useNavigate();

   const first = games.at(0);
   if (first === undefined) return <p className="app__message">No saved games found.</p>;
   const selected = games.find((game) => game.id === gameId);
   if (selected === undefined || view === undefined) {
      return <Navigate to={gamePath(selected?.id ?? first.id, view)} replace />;
   }

   return (
      <>
         <GamePicker
            games={games}
            selectedId={selected.id}
            onSelect={(id) => navigate(gamePath(id, view))}
         />
         <GameNav gameId={selected.id} />
         <Suspense fallback={view === GAME_VIEWS.REPLAY ? <ReplayScreen /> : null}>
            <GameProvider key={selected.id} gameId={selected.id}>
               <Outlet />
            </GameProvider>
         </Suspense>
      </>
   );
}

export default GameLayout;
