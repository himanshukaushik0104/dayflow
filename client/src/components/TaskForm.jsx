import { useEffect, useRef, useState } from 'react';
import './TaskForm.css';

const CATEGORIES = [
  { value: '', label: 'No category' },
  { value: 'work', label: 'Work' },
  { value: 'health', label: 'Health' },
  { value: 'personal', label: 'Personal' },
];

function defaultTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function TaskForm({ initial, title = 'Add task', submitLabel = 'Add', onSubmit, onCancel }) {
  const [time, setTime] = useState(initial?.time ?? defaultTime());
  const [label, setLabel] = useState(initial?.label ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const formRef = useRef(null);
  const labelRef = useRef(null);

  // Form is fixed-positioned (popover above the FAB), so just focus
  // the label on mount.
  useEffect(() => {
    labelRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!onCancel) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
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
        category: category || null,
      });
    } catch (err) {
      setError(err.message || 'Could not save task');
      setBusy(false);
    }
  };

  return (
    <form ref={formRef} className="task-form" onSubmit={handleSubmit}>
      <div className="task-form__title">{title}</div>

      <div className="task-form__grid">
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
        <span className="field-label">Label</span>
        <input
          ref={labelRef}
          className="input"
          type="text"
          required
          maxLength={120}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Review PR #42"
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

      <div className="task-form__actions">
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
