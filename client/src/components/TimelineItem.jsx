import Icon from './Icon.jsx';
import { CategoryPill, TypePill } from './Pills.jsx';
import './TimelineItem.css';

export default function TimelineItem({
  type,           // 'routine' | 'task'
  time,
  label,
  note,
  category,
  done,
  onToggle,
  onEdit,
  onDelete,
}) {
  const cls = [
    'timeline-item',
    `timeline-item--${type}`,
    done ? 'is-done' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cls}>
      <div className="timeline-item__body">
        <div className="timeline-item__pills">
          <CategoryPill category={category} />
          <TypePill type={type} />
        </div>
        <h3 className="timeline-item__label">
          <span className="timeline-item__time">{time}</span>
          <span className="timeline-item__sep"> — </span>
          {label}
        </h3>
        {note && <p className="timeline-item__note">{note}</p>}
      </div>

      <div className="timeline-item__actions">
        {onEdit && (
          <button
            type="button"
            className="timeline-item__icon-btn"
            onClick={onEdit}
            aria-label={`Edit ${label}`}
          >
            <Icon name="edit" size={18} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="timeline-item__icon-btn"
            onClick={onDelete}
            aria-label={`Delete ${label}`}
          >
            <Icon name="delete" size={18} />
          </button>
        )}
        <button
          type="button"
          role="checkbox"
          aria-checked={!!done}
          aria-label={done ? `Mark ${label} incomplete` : `Mark ${label} complete`}
          onClick={() => onToggle(!done)}
          className={`timeline-item__check timeline-item__check--${type}${done ? ' is-on' : ''}`}
        >
          <Icon
            name={done ? 'check_circle' : 'radio_button_unchecked'}
            filled={done}
            size={22}
          />
        </button>
      </div>
    </article>
  );
}
