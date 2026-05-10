import Icon from './Icon.jsx';
import './StreakBadge.css';

export default function StreakBadge({ count }) {
  return (
    <span className="streak-badge" aria-label={`${count} day streak`}>
      <Icon name="local_fire_department" filled size={18} className="streak-badge__icon" />
      <span className="streak-badge__text">
        {count} Day Streak
      </span>
    </span>
  );
}
