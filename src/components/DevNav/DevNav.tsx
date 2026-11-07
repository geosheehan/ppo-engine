import '@components/DevNav/DevNav.css';
import { clsx } from 'clsx';
import { NavLink } from 'react-router';
import { GAMES_PATH, WHAT_IF_PATH } from '@layout/routes';

const LINKS = [
   { to: '/', label: 'Vote' },
   { to: GAMES_PATH, label: 'Games' },
   { to: WHAT_IF_PATH, label: 'What if' },
];

function DevNav() {
   return (
      <nav className="dev-nav" aria-label="Pages">
         <button type="button" className="dev-nav__handle" aria-label="Show pages">
            ≡
         </button>
         <div className="dev-nav__links">
            {LINKS.map(({ to, label }) => (
               <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                     clsx('dev-nav__link', isActive && 'dev-nav__link--active')
                  }
               >
                  {label}
               </NavLink>
            ))}
         </div>
      </nav>
   );
}

export default DevNav;
