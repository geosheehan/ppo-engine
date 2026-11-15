import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { GAMES_PATH, WHAT_IF_PATH } from '@layout/routes';

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
            {EmptyRink !== undefined && (
               <Route
                  index
                  element={
                     <Suspense>
                        <EmptyRink emptyTitle="Pick a game" />
                     </Suspense>
                  }
               />
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

export default AppRoutes;
