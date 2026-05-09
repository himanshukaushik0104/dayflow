import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api.js';
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

export default function EditRoutine() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

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

  const handleAdd = async (payload) => {
    const created = await apiPost('/api/routine', payload);
    setSlots((prev) =>
      reindex(
        [...prev, created].sort((a, b) =>
          a.time !== b.time ? (a.time < b.time ? -1 : 1) : a.position - b.position,
        ),
      ),
    );
    setAdding(false);
    toast.success('Routine slot added');
  };

  const handleEdit = async (id, payload) => {
    const updated = await apiPut(`/api/routine/${id}`, payload);
    setSlots((prev) =>
      reindex(
        prev
          .map((s) => (s.id === id ? updated : s))
          .sort((a, b) =>
            a.time !== b.time ? (a.time < b.time ? -1 : 1) : a.position - b.position,
          ),
      ),
    );
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

  const handleDragStart = (e, slot) => {
    setDragId(slot.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slot.id);
  };
  const handleDragOver = (e, slot) => {
    if (!dragId || dragId === slot.id) return;
    const dragSlot = slots.find((s) => s.id === dragId);
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
    const dragSlot = slots.find((s) => s.id === sourceId);
    if (!dragSlot || dragSlot.time !== slot.time) return;
    const without = slots.filter((s) => s.id !== sourceId);
    const targetIdx = without.findIndex((s) => s.id === slot.id);
    const reordered = reindex([
      ...without.slice(0, targetIdx),
      dragSlot,
      ...without.slice(targetIdx),
    ]);
    const snapshot = slots;
    setSlots(reordered);
    const changed = reordered
      .filter((s) => snapshot.find((p) => p.id === s.id)?.position !== s.position)
      .map((s) => ({ id: s.id, position: s.position }));
    if (changed.length === 0) return;
    try {
      await apiPut('/api/routine/reorder', { items: changed });
    } catch (err) {
      setSlots(snapshot);
      toast.error(err.message || 'Could not reorder');
    }
  };

  const dragSlot = dragId ? slots.find((s) => s.id === dragId) : null;
  const editingSlot = editingId ? slots.find((s) => s.id === editingId) : null;

  return (
    <Layout profile={profile}>
      <div className="routine">
        <header className="routine__head">
          <h1 className="routine__title">Routine</h1>
          <p className="routine__subtitle">Architect your daily rhythm with precision.</p>
        </header>

        <MobileTabs />

        <p className="routine__hint">
          Changes apply from tomorrow — today's timeline isn't reordered retroactively.
        </p>

        {loading ? (
          <div className="routine__placeholder">Loading…</div>
        ) : slots.length === 0 ? (
          <div className="routine__placeholder">
            No routine slots yet. Add your first one below.
          </div>
        ) : (
          <div className="routine__list">
            {slots
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
          <RoutineForm onSubmit={handleAdd} onCancel={() => setAdding(false)} />
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
