import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import './BottomNav.css';

const TABS = [
  { to: '/app', icon: 'calendar_today', label: 'Today', end: true },
  { to: '/app/routine', icon: 'event_repeat', label: 'Routine' },
  { to: '/profile', icon: 'person', label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <Icon name={t.icon} filled={isActive} size={22} />
              <span className="bottom-nav__label">{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
