import '@components/GameNav/GameNav.css';
import { clsx } from 'clsx';
import { NavLink } from 'react-router';
import { GAME_VIEW_LABELS, GAME_VIEWS, gamePath } from '@layout/routes';

type GameNavProps = {
   gameId: string;
};

function GameNav({ gameId }: GameNavProps) {
   return (
      <nav className="game-nav" aria-label="Game views">
         {Object.values(GAME_VIEWS).map((view) => (
            <NavLink
               key={view}
               to={gamePath(gameId, view)}
               className={({ isActive }) =>
                  clsx('game-nav__link', isActive && 'game-nav__link--active')
               }
            >
               {GAME_VIEW_LABELS[view]}
            </NavLink>
         ))}
      </nav>
   );
}

export default GameNav;
