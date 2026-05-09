import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Avatar from './Avatar.jsx';
import './TopBar.css';

export default function TopBar({ profile }) {
  const { session } = useAuth();
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link to={session ? '/app' : '/login'} className="topbar__brand" aria-label="DayFlow">
          <img className="topbar__logo" src="/dayflow-logo.png" alt="DayFlow" />
        </Link>
        <div className="topbar__actions">
          <ThemeToggle />
          {session ? (
            <Link to="/profile" className="topbar__avatar" aria-label="Profile">
              <Avatar url={profile?.avatar_url} name={profile?.display_name} size={32} />
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
