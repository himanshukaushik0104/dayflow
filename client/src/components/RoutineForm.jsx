import { useEffect, useRef, useState } from 'react';
import { WEEKDAYS } from '../lib/dates.js';
import './RoutineForm.css';

const CATEGORIES = [
  { value: 'work', label: 'Work' },
  { value: 'health', label: 'Health' },
  { value: 'personal', label: 'Personal' },
];

// Use a sentinel string for "every day" because `null` doesn't survive
// a <select> round-trip cleanly.
const EVERY_DAY = 'all';

export default function RoutineForm({
  initial,
  title = 'Add routine slot',
  submitLabel = 'Add',
  onSubmit,
  onCancel,
}) {
  const [time, setTime] = useState(initial?.time ?? '07:00');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'personal');
  const [day, setDay] = useState(() => {
    if (initial && initial.day_of_week !== undefined) {
      return initial.day_of_week === null ? EVERY_DAY : String(initial.day_of_week);
    }
    return EVERY_DAY;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const formRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    labelRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!onCancel) return;
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onSubmit({
        time,
        label: label.trim(),
        note: note.trim() || null,
        category,
        day_of_week: day === EVERY_DAY ? null : Number(day),
      });
    } catch (err) {
      setError(err.message || 'Could not save slot');
      setBusy(false);
    }
  };

  return (
    <form ref={formRef} className="card routine-form" onSubmit={handleSubmit}>
      <div className="routine-form__title">{title}</div>

      <div className="routine-form__grid">
        <label className="field">
          <span className="field-label">Time</span>
          <input
            className="input"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Category</span>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span className="field-label">Repeat on</span>
        <select
          className="input"
          value={day}
          onChange={(e) => setDay(e.target.value)}
        >
          <option value={EVERY_DAY}>Every day</option>
          {WEEKDAYS.map((w) => (
            <option key={w.value} value={String(w.value)}>{w.long}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">Label</span>
        <input
          ref={labelRef}
          className="input"
          type="text"
          required
          maxLength={120}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Morning run"
        />
      </label>

      <label className="field">
        <span className="field-label">Note (optional)</span>
        <input
          className="input"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      {error && <div className="error-text">{error}</div>}

      <div className="routine-form__actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy || !label.trim()}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
