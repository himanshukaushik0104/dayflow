import { useNavigate, useLocation } from 'react-router-dom';
import './MobileTabs.css';

const TABS = [
  { label: 'Today', path: '/app' },
  { label: 'Edit Routine', path: '/app/routine' },
];

// Visible on mobile only — desktop uses the sidebar instead. Lets users
// switch between the today timeline and the routine editor without
// leaving the bottom-nav's "Today" section.
export default function MobileTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <div className="mobile-tabs" role="tablist">
      {TABS.map((t) => {
        const active = pathname === t.path;
        return (
          <button
            key={t.path}
            type="button"
            role="tab"
            aria-selected={active}
            className={`mobile-tabs__btn${active ? ' is-active' : ''}`}
            onClick={() => !active && navigate(t.path)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
