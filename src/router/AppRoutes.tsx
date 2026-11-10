import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { GAMES_PATH, VOTE_PATH, WHAT_IF_PATH } from '@layout/routes';

const SHOW_GAME_VIEWS = import.meta.env.VITE_GAME_VIEWS === 'true';
const SHOW_VOTE = import.meta.env.DEV || !SHOW_GAME_VIEWS;
const HeadshotDebugView = SHOW_VOTE ? lazy(() => import('@views/HeadshotDebugView')) : undefined;
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
                  {HeadshotDebugView !== undefined && (
                     <Route path={VOTE_PATH} element={<HeadshotDebug view={HeadshotDebugView} />} />
                  )}
               </>
            ) : (
               HeadshotDebugView !== undefined && (
                  <Route index element={<HeadshotDebug view={HeadshotDebugView} />} />
               )
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

function HeadshotDebug({ view: View }: { view: ComponentType }) {
   return (
      <Suspense fallback={<p className="app__message">Loading headshots…</p>}>
         <View />
      </Suspense>
   );
}

export default AppRoutes;
