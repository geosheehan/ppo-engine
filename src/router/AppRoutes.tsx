import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import HeadshotDebugView from '@views/HeadshotDebugView';
import { GAMES_PATH, VOTE_PATH, WHAT_IF_PATH } from '@layout/routes';

const SHOW_GAME_VIEWS = import.meta.env.VITE_GAME_VIEWS === 'true';
const GameRoutes = SHOW_GAME_VIEWS ? lazy(() => import('@router/GameRoutes')) : undefined;
const WhatIfView = SHOW_GAME_VIEWS ? lazy(() => import('@views/WhatIfView')) : undefined;
const AppNav = SHOW_GAME_VIEWS ? lazy(() => import('@components/AppNav')) : undefined;
const EmptyRink = SHOW_GAME_VIEWS
   ? lazy(() => import('@views/ReplayView/ReplayScreen'))
   : undefined;

function AppRoutes() {
   return (
      <>
         {AppNav !== undefined && (
            <Suspense>
               <AppNav />
            </Suspense>
         )}
         <Routes>
            {EmptyRink !== undefined ? (
               <>
                  <Route
                     index
                     element={
                        <Suspense>
                           <EmptyRink emptyTitle="Pick a game" />
                        </Suspense>
                     }
                  />
                  <Route path={VOTE_PATH} element={<HeadshotDebug />} />
               </>
            ) : (
               <Route index element={<HeadshotDebug />} />
            )}
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
            {WhatIfView !== undefined && (
               <Route
                  path={WHAT_IF_PATH}
                  element={
                     <Suspense>
                        <WhatIfView />
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
