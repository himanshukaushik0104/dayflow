import Icon from './Icon.jsx';
import { CategoryPill } from './Pills.jsx';
import './RoutineRow.css';

export default function RoutineRow({
  slot,
  isDragging,
  isOver,
  isInactive,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) {
  const cls = [
    'routine-row',
    `routine-row--${slot.category}`,
    isDragging ? 'is-dragging' : '',
    isOver ? 'is-over' : '',
    isInactive ? 'is-inactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cls}
      draggable
      onDragStart={(e) => onDragStart(e, slot)}
      onDragOver={(e) => onDragOver(e, slot)}
      onDragLeave={(e) => onDragLeave?.(e, slot)}
      onDrop={(e) => onDrop(e, slot)}
      onDragEnd={onDragEnd}
    >
      <span className="routine-row__grip" aria-label="Drag to reorder">
        <Icon name="drag_indicator" size={20} />
      </span>
      <span className="routine-row__time">{slot.time}</span>
      <div className="routine-row__body">
        <div className="routine-row__label">{slot.label}</div>
        {slot.note && <div className="routine-row__note">{slot.note}</div>}
      </div>
      <span className="routine-row__cat">
        <CategoryPill category={slot.category} />
      </span>
      <span className="routine-row__actions">
        <button
          type="button"
          className="routine-row__icon-btn"
          onClick={onEdit}
          aria-label={`Edit ${slot.label}`}
        >
          <Icon name="edit" size={18} />
        </button>
        <button
          type="button"
          className="routine-row__icon-btn routine-row__icon-btn--danger"
          onClick={onDelete}
          aria-label={`Delete ${slot.label}`}
        >
          <Icon name="delete" size={18} />
        </button>
      </span>
    </div>
  );
}
