import './Icon.css';

// Wraps Google's Material Symbols Outlined font so usage is one-line and
// the FILL axis is easy to toggle (used for the routine "check_circle"
// fill state).
export default function Icon({ name, filled = false, size = 20, className = '' }) {
  return (
    <span
      className={`mi${filled ? ' mi--filled' : ''} ${className}`.trim()}
      style={{ fontSize: size, width: size, height: size, lineHeight: `${size}px` }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
