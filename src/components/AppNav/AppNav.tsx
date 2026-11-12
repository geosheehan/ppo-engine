import '@components/AppNav/AppNav.css';
import { useId } from 'react';
import type { MouseEvent } from 'react';
import { clsx } from 'clsx';
import { Link, NavLink, useMatch, useNavigate } from 'react-router';
import GamePicker from '@components/GamePicker';
import CloseIcon from '@components/icons/nav/CloseIcon';
import MenuIcon from '@components/icons/nav/MenuIcon';
import { useGameSummary } from '@hooks/useGameSummary';
import { useSelectedGame } from '@context/useSelectedGame';
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
   const { gameId, selectGame } = useSelectedGame();
   const view = isGameView(match?.params.view) ? match.params.view : GAME_VIEWS.REPLAY;
   const selected = useGameSummary(gameId);
   const drawerId = useId();

   const pick = (id: string) => {
      if (match !== null || atHome) void navigate(gamePath(id, view));
      else selectGame(id);
   };

   const links = [
      ...Object.values(GAME_VIEWS).map((gameView) => ({
         to: gameId === undefined ? '/' : gamePath(gameId, gameView),
         label: GAME_VIEW_LABELS[gameView],
         activeHere: match !== null || gameView === GAME_VIEWS.REPLAY,
      })),
      { to: WHAT_IF_PATH, label: 'What if', activeHere: true },
   ];

   const pageLinks = (onFollow?: (event: MouseEvent<HTMLElement>) => void) =>
      links.map(({ to, label, activeHere }) => (
         <NavLink
            key={label}
            to={to}
            end
            onClick={onFollow}
            className={({ isActive }) =>
               clsx('app-nav__link', isActive && activeHere && 'app-nav__link--active')
            }
         >
            {label}
         </NavLink>
      ));
   const closeDrawer = (event: MouseEvent<HTMLElement>) =>
      event.currentTarget.closest<HTMLElement>('[popover]')?.hidePopover();

   return (
      <header className="app-nav">
         <button
            type="button"
            className="app-nav__menu"
            popoverTarget={drawerId}
            aria-label="Pages"
            title="Pages"
         >
            <MenuIcon size={20} />
         </button>
         <Link to="/" className="app-nav__brand">
            PPO Engine
         </Link>
         <nav className="app-nav__links" aria-label="Pages">
            {pageLinks()}
         </nav>
         <div
            id={drawerId}
            popover="auto"
            role="dialog"
            aria-label="Pages"
            className="app-nav__drawer"
         >
            <div className="app-nav__drawer-head">
               <span className="app-nav__brand">PPO Engine</span>
               <button
                  type="button"
                  className="app-nav__menu app-nav__close"
                  aria-label="Close"
                  title="Close"
                  popoverTarget={drawerId}
                  popoverTargetAction="hide"
               >
                  <CloseIcon size={20} />
               </button>
            </div>
            <nav className="app-nav__drawer-links" aria-label="Pages">
               {pageLinks(closeDrawer)}
            </nav>
         </div>
         <div className="app-nav__game">
            <GamePicker selected={selected} autoOpen={atHome} onPick={pick} />
         </div>
      </header>
   );
}

export default AppNav;
