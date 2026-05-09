import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import './Sidebar.css';

const ITEMS = [
  { to: '/app', icon: 'calendar_today', label: 'Today', end: true },
  { to: '/app/routine', icon: 'event_repeat', label: 'Routine' },
  { to: '/profile', icon: 'person', label: 'Profile' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Primary">
      <nav className="sidebar__nav">
        {ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => `sidebar__item${isActive ? ' is-active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Icon name={it.icon} filled={isActive} size={20} />
                <span>{it.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
