import { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api.js';
import { todayLocal, formatLongDate } from '../lib/dates.js';
import { useToast } from '../hooks/useToast.jsx';
import Layout from '../components/Layout.jsx';
import MobileTabs from '../components/MobileTabs.jsx';
import ProgressCard from '../components/ProgressCard.jsx';
import StreakBadge from '../components/StreakBadge.jsx';
import TimelineItem from '../components/TimelineItem.jsx';
import TaskForm from '../components/TaskForm.jsx';
import Fab from '../components/Fab.jsx';
import './Today.css';

export default function Today() {
  const navigate = useNavigate();
  const toast = useToast();
  const [date, setDate] = useState(() => todayLocal());

  // Roll the date over when local midnight passes (so a tab left open
  // overnight starts showing the new day) and when the user returns to
  // the tab after some time away.
  useEffect(() => {
    const sync = () => {
      const current = todayLocal();
      setDate((prev) => (prev !== current ? current : prev));
    };
    let timer;
    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now);
      // ~5 s past midnight to dodge clock-skew races.
      next.setHours(24, 0, 5, 0);
      timer = setTimeout(() => {
        sync();
        scheduleMidnight();
      }, next.getTime() - now.getTime());
    };
    scheduleMidnight();
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const [profile, setProfile] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [tasks, setTasks] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const refreshStreak = useCallback(async () => {
    try {
      const res = await apiGet(`/api/streak?date=${date}`);
      setStreak(res.streak ?? 0);
    } catch {
      // Streak is non-critical; don't surface a toast for it.
    }
  }, [date]);

  const load = useCallback(async () => {
    try {
      const [prof, slots, comps, tks, str] = await Promise.all([
        apiGet('/api/profile'),
        apiGet('/api/routine'),
        apiGet(`/api/completions/${date}`),
        apiGet(`/api/tasks/${date}`),
        apiGet(`/api/streak?date=${date}`),
      ]);
      setProfile(prof);
      setRoutines(slots);
      setCompleted(new Set(comps.slot_ids));
      setTasks(tks);
      setStreak(str.streak ?? 0);
    } catch (err) {
      toast.error(err.message || 'Could not load today');
    } finally {
      setLoading(false);
    }
  }, [date, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const timeline = useMemo(() => {
    const r = routines.map((s) => ({
      key: `r:${s.id}`,
      type: 'routine',
      id: s.id,
      time: s.time,
      label: s.label,
      note: s.note,
      category: s.category,
      done: completed.has(s.id),
    }));
    const t = tasks.map((task) => ({
      key: `t:${task.id}`,
      type: 'task',
      id: task.id,
      time: task.time,
      label: task.label,
      note: task.note,
      category: task.category,
      done: task.done,
    }));
    return [...r, ...t].sort((a, b) => {
      if (a.time !== b.time) return a.time < b.time ? -1 : 1;
      if (a.type !== b.type) return a.type === 'routine' ? -1 : 1;
      return 0;
    });
  }, [routines, tasks, completed]);

  const totals = useMemo(() => {
    const total = timeline.length;
    const doneCount = timeline.filter((i) => i.done).length;
    return { total, doneCount };
  }, [timeline]);

  const toggleRoutine = async (slotId, next) => {
    setCompleted((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(slotId);
      else copy.delete(slotId);
      return copy;
    });
    try {
      await apiPost('/api/completions', { date, slot_id: slotId, completed: next });
      refreshStreak();
    } catch (err) {
      setCompleted((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(slotId);
        else copy.add(slotId);
        return copy;
      });
      toast.error(err.message || 'Could not update');
    }
  };

  const toggleTask = async (taskId, next) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: next } : t)));
    try {
      await apiPut(`/api/tasks/${taskId}`, { done: next });
      refreshStreak();
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: !next } : t)));
      toast.error(err.message || 'Could not update');
    }
  };

  const handleAdd = async (payload) => {
    const created = await apiPost('/api/tasks', { date, ...payload });
    setTasks((prev) => [...prev, created]);
    setAdding(false);
    toast.success('Task added');
    refreshStreak();
  };

  const handleEditTask = async (taskId, payload) => {
    const updated = await apiPut(`/api/tasks/${taskId}`, payload);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    setEditingTaskId(null);
    toast.success('Task updated');
    refreshStreak();
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await apiDelete(`/api/tasks/${taskId}`);
      toast.success('Task deleted');
      refreshStreak();
    } catch (err) {
      setTasks(snapshot);
      toast.error(err.message || 'Could not delete');
    }
  };

  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;

  return (
    <Layout profile={profile}>
      <div className="today">
        <header className="today__head">
          <h1 className="today__title">Today</h1>
          <p className="today__subtitle">{formatLongDate(date)}</p>
          <StreakBadge count={streak} />
        </header>

        <ProgressCard done={totals.doneCount} total={totals.total} />

        <MobileTabs />

        {loading ? (
          <div className="today__placeholder">Loading…</div>
        ) : timeline.length === 0 ? (
          <div className="today__placeholder">
            Nothing on today's plan yet. Add a task or set up your routine.
          </div>
        ) : (
          <div className="timeline">
            {timeline
              // Hide the task currently being edited so the popover replaces it.
              .filter((item) => !(item.type === 'task' && item.id === editingTaskId))
              .map((item) => (
                <TimelineItem
                  key={item.key}
                  type={item.type}
                  time={item.time}
                  label={item.label}
                  note={item.note}
                  category={item.category}
                  done={item.done}
                  onToggle={(next) =>
                    item.type === 'routine'
                      ? toggleRoutine(item.id, next)
                      : toggleTask(item.id, next)
                  }
                  onEdit={
                    item.type === 'routine'
                      ? () => navigate('/app/routine')
                      : () => setEditingTaskId(item.id)
                  }
                  onDelete={item.type === 'task' ? () => handleDeleteTask(item.id) : undefined}
                />
              ))}
          </div>
        )}

        {adding && (
          <TaskForm
            title="Add task"
            submitLabel="Add task"
            onSubmit={handleAdd}
            onCancel={() => setAdding(false)}
          />
        )}

        {editingTask && (
          <TaskForm
            title="Edit task"
            submitLabel="Save"
            initial={{
              time: editingTask.time,
              label: editingTask.label,
              note: editingTask.note,
              category: editingTask.category,
            }}
            onSubmit={(payload) => handleEditTask(editingTaskId, payload)}
            onCancel={() => setEditingTaskId(null)}
          />
        )}

        {!adding && !editingTaskId && <Fab onClick={() => setAdding(true)} />}
      </div>
    </Layout>
  );
}
