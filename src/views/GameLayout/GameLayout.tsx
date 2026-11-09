import { Suspense, use } from 'react';
import { Navigate, Outlet, useMatch, useParams } from 'react-router';
import ReplayScreen from '@views/ReplayView/ReplayScreen';
import ErrorBoundary from '@components/ErrorBoundary';
import GameProvider from '@context/GameProvider';
import { ppoApi } from '@api/ppoApi';
import { GAME_VIEW_PATTERN, GAME_VIEWS, gamePath, isGameView } from '@layout/routes';

function GameLayout() {
   const games = use(ppoApi.listGames());
   const { gameId } = useParams();
   const viewParam = useMatch(GAME_VIEW_PATTERN)?.params.view;
   const view = isGameView(viewParam) ? viewParam : undefined;

   const first = games.at(0);
   if (first === undefined) return <p className="app__message">No saved games found.</p>;
   const selected = games.find((game) => game.id === gameId);
   if (selected === undefined || view === undefined) {
      return <Navigate to={gamePath(selected?.id ?? first.id, view)} replace />;
   }

   return (
      <ErrorBoundary
         key={selected.id}
         fallback={gameLoadError}
         onRetry={() => ppoApi.forgetGamePpo(selected.id)}
      >
         <Suspense fallback={view === GAME_VIEWS.REPLAY ? <ReplayScreen /> : null}>
            <GameProvider gameId={selected.id}>
               <Outlet />
            </GameProvider>
         </Suspense>
      </ErrorBoundary>
   );
}

function gameLoadError(error: Error, retry: () => void) {
   return (
      <div className="app__message" role="alert">
         <p>Couldn't load this game. {error.message}</p>
         <button type="button" onClick={retry}>
            Try again
         </button>
      </div>
   );
}

export default GameLayout;
