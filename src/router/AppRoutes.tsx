import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import HeadshotDebugView from '@views/HeadshotDebugView';
import { GAMES_PATH } from '@layout/routes';

const SHOW_GAME_VIEWS = import.meta.env.VITE_GAME_VIEWS === 'true';
const GameRoutes = SHOW_GAME_VIEWS ? lazy(() => import('@router/GameRoutes')) : undefined;
const DevNav = SHOW_GAME_VIEWS ? lazy(() => import('@components/DevNav')) : undefined;

function AppRoutes() {
   return (
      <>
         {DevNav !== undefined && (
            <Suspense>
               <DevNav />
            </Suspense>
         )}
         <Routes>
            <Route index element={<HeadshotDebug />} />
            {GameRoutes !== undefined && (
               <Route
                  path={`${GAMES_PATH}/*`}
                  element={
                     <Suspense>
                        <GameRoutes />
                     </Suspense>
                  }
               />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
         </Routes>
      </>
   );
}

function HeadshotDebug() {
   return (
      <Suspense fallback={<p className="app__message">Loading headshots…</p>}>
         <HeadshotDebugView />
      </Suspense>
   );
}

export default AppRoutes;
