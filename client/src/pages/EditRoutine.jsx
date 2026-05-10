import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api.js';
import { todayLocal, dayOfWeekFor, WEEKDAYS } from '../lib/dates.js';
import { useToast } from '../hooks/useToast.jsx';
import Layout from '../components/Layout.jsx';
import MobileTabs from '../components/MobileTabs.jsx';
import RoutineRow from '../components/RoutineRow.jsx';
import RoutineForm from '../components/RoutineForm.jsx';
import Icon from '../components/Icon.jsx';
import './EditRoutine.css';

function reindex(slots) {
  const counters = {};
  return slots.map((s) => {
    const idx = counters[s.time] ?? 0;
    counters[s.time] = idx + 1;
    return { ...s, position: idx };
  });
}

function sortSlots(arr) {
  return [...arr].sort((a, b) =>
    a.time !== b.time ? (a.time < b.time ? -1 : 1) : a.position - b.position,
  );
}

export default function EditRoutine() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(() => dayOfWeekFor(todayLocal()));
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [copyOpen, setCopyOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [prof, list] = await Promise.all([apiGet('/api/profile'), apiGet('/api/routine')]);
      setProfile(prof);
      setSlots(list);
    } catch (err) {
      toast.error(err.message || 'Could not load routine');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Slots visible under the active tab: this day's slots + every-day slots.
  const visibleSlots = useMemo(
    () =>
      sortSlots(
        slots.filter((s) => s.day_of_week === null || s.day_of_week === activeDay),
      ),
    [slots, activeDay],
  );

  const handleAdd = async (payload) => {
    const created = await apiPost('/api/routine', payload);
    setSlots((prev) => [...prev, created]);
    setAdding(false);
    toast.success('Routine slot added');
  };

  const handleEdit = async (id, payload) => {
    const updated = await apiPut(`/api/routine/${id}`, payload);
    setSlots((prev) => prev.map((s) => (s.id === id ? updated : s)));
    setEditingId(null);
    toast.success('Routine slot updated');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this routine slot?')) return;
    const snapshot = slots;
    setSlots((prev) => prev.filter((s) => s.id !== id));
    try {
      await apiDelete(`/api/routine/${id}`);
      toast.success('Routine slot deleted');
    } catch (err) {
      setSlots(snapshot);
      toast.error(err.message || 'Could not delete');
    }
  };

  const handleCopy = async (fromDay) => {
    setCopyOpen(false);
    const fromLabel = WEEKDAYS.find((w) => w.value === fromDay)?.long ?? '';
    const toLabel = WEEKDAYS.find((w) => w.value === activeDay)?.long ?? '';
    const ok = window.confirm(
      `Replace ${toLabel}'s routines with a copy of ${fromLabel}'s? This deletes any ${toLabel}-specific slots.`,
    );
    if (!ok) return;
    try {
      const { inserted } = await apiPost('/api/routine/copy', { from: fromDay, to: activeDay });
      setSlots((prev) => [
        ...prev.filter((s) => s.day_of_week !== activeDay),
        ...inserted,
      ]);
      toast.success(
        inserted.length === 0
          ? `${toLabel} cleared (no slots on ${fromLabel})`
          : `Copied ${inserted.length} slot${inserted.length === 1 ? '' : 's'} to ${toLabel}`,
      );
    } catch (err) {
      toast.error(err.message || 'Could not copy');
    }
  };

  // --- Drag-reorder (kept scoped to the active view; only same-time
  // slots reorder, matching the previous behaviour). -----------------
  const handleDragStart = (e, slot) => {
    setDragId(slot.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slot.id);
  };
  const handleDragOver = (e, slot) => {
    if (!dragId || dragId === slot.id) return;
    const dragSlot = visibleSlots.find((s) => s.id === dragId);
    if (!dragSlot || dragSlot.time !== slot.time) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverId(slot.id);
  };
  const handleDragLeave = (_e, slot) => {
    if (overId === slot.id) setOverId(null);
  };
  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };
  const handleDrop = async (e, slot) => {
    e.preventDefault();
    const sourceId = dragId;
    setDragId(null);
    setOverId(null);
    if (!sourceId || sourceId === slot.id) return;
    const dragSlot = visibleSlots.find((s) => s.id === sourceId);
    if (!dragSlot || dragSlot.time !== slot.time) return;
    const without = visibleSlots.filter((s) => s.id !== sourceId);
    const targetIdx = without.findIndex((s) => s.id === slot.id);
    const reorderedVisible = reindex([
      ...without.slice(0, targetIdx),
      dragSlot,
      ...without.slice(targetIdx),
    ]);
    const snapshot = slots;
    const reorderedById = new Map(reorderedVisible.map((s) => [s.id, s]));
    setSlots((prev) => prev.map((s) => reorderedById.get(s.id) ?? s));
    const changed = reorderedVisible
      .filter(
        (s) => visibleSlots.find((p) => p.id === s.id)?.position !== s.position,
      )
      .map((s) => ({ id: s.id, position: s.position }));
    if (changed.length === 0) return;
    try {
      await apiPut('/api/routine/reorder', { items: changed });
    } catch (err) {
      setSlots(snapshot);
      toast.error(err.message || 'Could not reorder');
    }
  };

  const dragSlot = dragId ? visibleSlots.find((s) => s.id === dragId) : null;
  const editingSlot = editingId ? slots.find((s) => s.id === editingId) : null;

  return (
    <Layout profile={profile}>
      <div className="routine">
        <header className="routine__head">
          <h1 className="routine__title">Routine</h1>
          <p className="routine__subtitle">Architect your daily rhythm with precision.</p>
        </header>

        <MobileTabs />

        <div className="day-tabs" role="tablist" aria-label="Day of week">
          {WEEKDAYS.map((w) => (
            <button
              key={w.value}
              type="button"
              role="tab"
              aria-selected={activeDay === w.value}
              className={`day-tabs__tab${activeDay === w.value ? ' is-active' : ''}`}
              onClick={() => {
                setActiveDay(w.value);
                setAdding(false);
                setEditingId(null);
              }}
            >
              {w.short}
            </button>
          ))}
        </div>

        <div className="routine__toolbar">
          <p className="routine__hint">
            Changes apply from the next matching {WEEKDAYS.find((w) => w.value === activeDay)?.long}.
          </p>
          <button
            type="button"
            className="btn btn-secondary routine__copy-btn"
            onClick={() => setCopyOpen((v) => !v)}
          >
            <Icon name="content_copy" size={16} />
            Copy from…
          </button>
        </div>

        {copyOpen && (
          <div className="copy-menu" role="menu">
            <div className="copy-menu__title">Copy which day's routines here?</div>
            <div className="copy-menu__grid">
              {WEEKDAYS.filter((w) => w.value !== activeDay).map((w) => (
                <button
                  key={w.value}
                  type="button"
                  className="btn btn-secondary copy-menu__day"
                  onClick={() => handleCopy(w.value)}
                >
                  {w.long}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="routine__placeholder">Loading…</div>
        ) : visibleSlots.length === 0 ? (
          <div className="routine__placeholder">
            No routine slots for{' '}
            {WEEKDAYS.find((w) => w.value === activeDay)?.long}. Add one below or copy from another day.
          </div>
        ) : (
          <div className="routine__list">
            {visibleSlots
              .filter((slot) => slot.id !== editingId)
              .map((slot) => (
                <RoutineRow
                  key={slot.id}
                  slot={slot}
                  isDragging={dragId === slot.id}
                  isOver={overId === slot.id}
                  isInactive={!!dragSlot && dragSlot.time !== slot.time}
                  onEdit={() => setEditingId(slot.id)}
                  onDelete={() => handleDelete(slot.id)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              ))}
          </div>
        )}

        {adding ? (
          <RoutineForm
            initial={{ day_of_week: activeDay }}
            onSubmit={handleAdd}
            onCancel={() => setAdding(false)}
          />
        ) : !editingSlot ? (
          <button
            type="button"
            className="routine__add"
            onClick={() => setAdding(true)}
          >
            <Icon name="add_circle" size={20} />
            Add routine slot
          </button>
        ) : null}

        {editingSlot && (
          <RoutineForm
            title="Edit routine slot"
            submitLabel="Save"
            initial={editingSlot}
            onSubmit={(payload) => handleEdit(editingSlot.id, payload)}
            onCancel={() => setEditingId(null)}
          />
        )}
      </div>
    </Layout>
  );
}
