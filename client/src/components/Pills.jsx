import './Pills.css';

const CATEGORY_LABEL = { work: 'Work', health: 'Health', personal: 'Personal' };

export function CategoryPill({ category }) {
  if (!category) return null;
  return (
    <span className={`pill pill-cat pill-cat--${category}`}>{CATEGORY_LABEL[category]}</span>
  );
}

export function TypePill({ type }) {
  return <span className={`pill pill-type pill-type--${type}`}>{type === 'routine' ? 'Routine' : 'Task'}</span>;
}
