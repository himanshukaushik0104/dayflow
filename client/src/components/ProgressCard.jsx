import './ProgressCard.css';

export default function ProgressCard({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="card progress-card">
      <div className="progress-card__row">
        <span className="progress-card__label">Today's progress</span>
        <span className="progress-card__count">
          {done} / {total} done
        </span>
      </div>
      <div className="progress-card__track">
        <div className="progress-card__bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
