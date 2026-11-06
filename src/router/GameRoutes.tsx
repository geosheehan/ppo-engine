import { Suspense } from 'react';
import { Route, Routes } from 'react-router';
import AnalysisView from '@views/AnalysisView';
import GameLayout from '@views/GameLayout';
import ReplayView from '@views/ReplayView';
import ReplayScreen from '@views/ReplayView/ReplayScreen';
import { GAME_VIEWS } from '@layout/routes';

function GameRoutes() {
   return (
      <Suspense fallback={<ReplayScreen />}>
         <Routes>
            <Route index element={<GameLayout />} />
            <Route path=":gameId" element={<GameLayout />}>
               <Route path={GAME_VIEWS.REPLAY} element={<ReplayView />} />
               <Route path={GAME_VIEWS.ANALYSIS} element={<AnalysisView />} />
               <Route path="*" element={null} />
            </Route>
         </Routes>
      </Suspense>
   );
}

export default GameRoutes;
