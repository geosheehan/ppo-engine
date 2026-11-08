import '@components/AppNav/AppNav.css';
import { use } from 'react';
import { clsx } from 'clsx';
import { Link, NavLink, useMatch, useNavigate } from 'react-router';
import GamePicker from '@components/GamePicker';
import { ppoApi } from '@api/ppoApi';
import {
   GAME_VIEW_LABELS,
   GAME_VIEW_PATTERN,
   GAME_VIEWS,
   gamePath,
   GAMES_PATH,
   isGameView,
   WHAT_IF_PATH,
} from '@layout/routes';

function AppNav() {
   const games = use(ppoApi.listGames());
   const match = useMatch(GAME_VIEW_PATTERN);
   const navigate = useNavigate();
   const selected = games.find((game) => game.id === match?.params.gameId);
   const view = isGameView(match?.params.view) ? match.params.view : undefined;
   const linkGameId = selected?.id ?? games.at(0)?.id;

   const links = [
      ...Object.values(GAME_VIEWS).map((gameView) => ({
         to: linkGameId === undefined ? GAMES_PATH : gamePath(linkGameId, gameView),
         label: GAME_VIEW_LABELS[gameView],
      })),
      { to: WHAT_IF_PATH, label: 'What if' },
   ];

   return (
      <header className="app-nav">
         <Link to="/" className="app-nav__brand">
            PPO Engine
         </Link>
         <nav className="app-nav__links" aria-label="Pages">
            {links.map(({ to, label }) => (
               <NavLink
                  key={label}
                  to={to}
                  className={({ isActive }) =>
                     clsx('app-nav__link', isActive && 'app-nav__link--active')
                  }
               >
                  {label}
               </NavLink>
            ))}
         </nav>
         {selected !== undefined && view !== undefined && (
            <div className="app-nav__game">
               <GamePicker
                  games={games}
                  selectedId={selected.id}
                  onSelect={(id) => navigate(gamePath(id, view))}
               />
            </div>
         )}
      </header>
   );
}

export default AppNav;
