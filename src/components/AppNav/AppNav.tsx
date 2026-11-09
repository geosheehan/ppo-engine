import '@components/AppNav/AppNav.css';
import { clsx } from 'clsx';
import { Link, NavLink, useMatch, useNavigate } from 'react-router';
import GamePicker from '@components/GamePicker';
import { useGameSummary } from '@hooks/useGameSummary';
import {
   GAME_VIEW_LABELS,
   GAME_VIEW_PATTERN,
   GAME_VIEWS,
   gamePath,
   isGameView,
   WHAT_IF_PATH,
} from '@layout/routes';

function AppNav() {
   const match = useMatch(GAME_VIEW_PATTERN);
   const atHome = useMatch('/') !== null;
   const navigate = useNavigate();
   const gameId = match?.params.gameId;
   const view = isGameView(match?.params.view) ? match.params.view : GAME_VIEWS.REPLAY;
   const selected = useGameSummary(gameId);

   const links = [
      ...Object.values(GAME_VIEWS).map((gameView) => ({
         to: gameId === undefined ? '/' : gamePath(gameId, gameView),
         label: GAME_VIEW_LABELS[gameView],
         activeHere: gameId !== undefined || gameView === GAME_VIEWS.REPLAY,
      })),
      { to: WHAT_IF_PATH, label: 'What if', activeHere: true },
   ];

   return (
      <header className="app-nav">
         <Link to="/" className="app-nav__brand">
            PPO Engine
         </Link>
         <nav className="app-nav__links" aria-label="Pages">
            {links.map(({ to, label, activeHere }) => (
               <NavLink
                  key={label}
                  to={to}
                  end
                  className={({ isActive }) =>
                     clsx('app-nav__link', isActive && activeHere && 'app-nav__link--active')
                  }
               >
                  {label}
               </NavLink>
            ))}
         </nav>
         {(atHome || gameId !== undefined) && (
            <div className="app-nav__game">
               <GamePicker
                  selected={selected}
                  autoOpen={atHome}
                  onPick={(id) => navigate(gamePath(id, view))}
               />
            </div>
         )}
      </header>
   );
}

export default AppNav;
