import { useTheme } from '../hooks/useTheme.jsx';
import Icon from './Icon.jsx';
import './ThemeToggle.css';

const OPTIONS = [
  { value: 'light', icon: 'light_mode', label: 'Light' },
  { value: 'system', icon: 'desktop_windows', label: 'System' },
  { value: 'dark', icon: 'dark_mode', label: 'Dark' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Theme">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={theme === opt.value}
          aria-label={opt.label}
          className={`theme-toggle__opt${theme === opt.value ? ' is-active' : ''}`}
          onClick={() => setTheme(opt.value)}
        >
          <Icon name={opt.icon} size={18} />
        </button>
      ))}
    </div>
  );
}
