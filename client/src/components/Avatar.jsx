import Icon from './Icon.jsx';
import './Avatar.css';

export default function Avatar({ url, name, size = 36 }) {
  if (url) {
    return (
      <img
        className="avatar avatar-img"
        src={url}
        alt={name || 'avatar'}
        style={{ width: size, height: size }}
      />
    );
  }
  // Default: a Material person glyph in a teal-tinted circle. Same look
  // for every user with no avatar uploaded.
  return (
    <div
      className="avatar avatar-fallback"
      style={{ width: size, height: size }}
      aria-label={name || 'avatar'}
    >
      <Icon name="person" filled size={Math.round(size * 0.6)} />
    </div>
  );
}
