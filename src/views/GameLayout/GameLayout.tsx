import { Suspense } from 'react';
import { Navigate, Outlet, useMatch, useParams } from 'react-router';
import ReplayScreen from '@views/ReplayView/ReplayScreen';
import ErrorBoundary from '@components/ErrorBoundary';
import GameProvider from '@context/GameProvider';
import { ppoApi } from '@api/ppoApi';
import { GAME_VIEW_PATTERN, GAME_VIEWS, gamePath, isGameView } from '@layout/routes';

function GameLayout() {
   const { gameId } = useParams();
   const viewParam = useMatch(GAME_VIEW_PATTERN)?.params.view;
   const view = isGameView(viewParam) ? viewParam : undefined;

   if (gameId === undefined) return <Navigate to="/" replace />;
   if (view === undefined) return <Navigate to={gamePath(gameId)} replace />;

   return (
      <ErrorBoundary
         key={gameId}
         fallback={gameLoadError}
         onRetry={() => ppoApi.forgetGamePpo(gameId)}
      >
         <Suspense fallback={view === GAME_VIEWS.REPLAY ? <ReplayScreen /> : null}>
            <GameProvider gameId={gameId}>
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
