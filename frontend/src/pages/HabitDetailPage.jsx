// src/pages/HabitDetailPage.jsx
// Momentum habit detail — hero ring, analytics, log history.

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import HabitFormModal from '../components/HabitFormModal';
import LogFormModal from '../components/LogFormModal';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import ThemeToggle from '../components/ThemeToggle';
import ProgressRing from '../components/ProgressRing';
import MomentumAurora from '../components/MomentumAurora';
import { useAuth } from '../context/AuthContext';
import {
  deleteHabit,
  deleteHabitLog,
  getHabit,
  getHabitLogs,
} from '../services/habits';
import { streakProgress } from '../lib/progress';
import { formatDate } from '../lib/format';
import '../styles/HabitDetail.css';

const STATUS_LABEL = { COMPLETED: 'Completed', SKIPPED: 'Skipped', MISSED: 'Missed' };
const STATUS_CLASS = { COMPLETED: 'done', SKIPPED: 'skipped', MISSED: 'missed' };

export default function HabitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [habit, setHabit] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editHabitOpen, setEditHabitOpen] = useState(false);
  const [logModal, setLogModal] = useState({ open: false, mode: 'create', log: null });
  const [deletingLogId, setDeletingLogId] = useState(null);
  const [deletingHabit, setDeletingHabit] = useState(false);

  const handleAuthFailure = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [habitData, logsData] = await Promise.all([getHabit(id), getHabitLogs(id)]);
      setHabit(habitData);
      setLogs([...logsData].sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      if (err?.response?.status === 401) {
        handleAuthFailure();
        return;
      }
      setError(err.message || 'Could not load this habit.');
    } finally {
      setLoading(false);
    }
  }, [id, handleAuthFailure]);

  useEffect(() => {
    load();
  }, [load]);

  function handleHabitSaved(saved) {
    setHabit(saved);
    setEditHabitOpen(false);
  }

  async function handleHabitDelete() {
    if (!window.confirm('Delete this habit? Its logs and streak history go with it.')) return;
    setDeletingHabit(true);
    try {
      await deleteHabit(id);
      navigate('/habits', { replace: true });
    } catch (err) {
      if (err?.response?.status === 401) {
        handleAuthFailure();
        return;
      }
      alert(err.message || 'Failed to delete the habit.');
      setDeletingHabit(false);
    }
  }

  function openCreateLog() {
    setLogModal({ open: true, mode: 'create', log: null });
  }

  function openEditLog(log) {
    setLogModal({ open: true, mode: 'edit', log });
  }

  function closeLogModal() {
    setLogModal({ open: false, mode: 'create', log: null });
  }

  function handleLogSaved(savedLog) {
    setLogs((cur) => {
      const exists = cur.some((l) => l.id === savedLog.id || l.date === savedLog.date);
      const next = exists
        ? cur.map((l) => (l.id === savedLog.id || l.date === savedLog.date ? savedLog : l))
        : [savedLog, ...cur];
      return [...next].sort((a, b) => new Date(b.date) - new Date(a.date));
    });
    closeLogModal();
    getHabit(id).then(setHabit).catch(() => {});
  }

  async function handleLogDelete(logId) {
    if (!window.confirm('Delete this log entry?')) return;
    const previous = logs;
    setDeletingLogId(logId);
    setLogs((cur) => cur.filter((l) => l.id !== logId));

    try {
      await deleteHabitLog(id, logId);
      getHabit(id).then(setHabit).catch(() => {});
    } catch (err) {
      if (err?.response?.status === 401) {
        handleAuthFailure();
        return;
      }
      setLogs(previous);
      alert(err.message || 'Failed to delete that log entry.');
    } finally {
      setDeletingLogId(null);
    }
  }

  if (loading) {
    return (
      <>
        <MomentumAurora />
        <Header />
        <div className="habit-detail mt-page">
          <div className="skeleton" style={{ minHeight: 150, marginBottom: 14 }} />
          <div className="skeleton" style={{ minHeight: 190, marginBottom: 14 }} />
          <div className="skeleton" />
        </div>
      </>
    );
  }

  if (error || !habit) {
    return (
      <>
        <MomentumAurora />
        <Header />
        <div className="habit-detail mt-page">
          <div className="state state--error">
            <p className="state__title">Couldn’t load this habit</p>
            <p>{error || 'Habit not found.'}</p>
            <button className="btn btn-secondary" onClick={load}>Try again</button>
          </div>
        </div>
      </>
    );
  }

  const isNumeric = habit.tracking_type === 'NUMERIC';
  const color = habit.color_hex && habit.color_hex.trim() ? habit.color_hex : '#10b981';
  const progress = streakProgress(habit);

  return (
    <>
      <MomentumAurora />
      <Header />

      <div className="habit-detail mt-page" style={{ '--habit-color': color }}>
        <div className="habit-detail__topbar">
          <Link to="/habits" className="habit-detail__back">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to habits
          </Link>
          <div className="habit-detail__spacer" />
          <ThemeToggle />
          <button
            className="icon-btn"
            onClick={() => setEditHabitOpen(true)}
            aria-label="Edit habit"
            title="Edit habit"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        </div>

        {/* ---- Hero ---- */}
        <section className="habit-detail__hero card animate-fade-up">
          <div className="habit-detail__hero-accent" />

          <div className="habit-detail__hero-body">
            <div className="habit-detail__hero-main">
              <div className="habit-detail__hero-copy">
                <h1 className="habit-detail__name">{habit.name}</h1>
                <div className="habit-detail__badges">
                  <span className="badge badge--accent">
                    {habit.frequency === 'WEEKLY' ? 'Weekly' : 'Daily'}
                  </span>
                  <span className="badge">
                    {isNumeric ? `Numeric${habit.unit ? ` · ${habit.unit}` : ''}` : 'Done / not done'}
                  </span>
                  {habit.active === false && <span className="badge badge--muted">Inactive</span>}
                </div>

                {habit.description && (
                  <p className="habit-detail__desc">{habit.description}</p>
                )}
              </div>

              <div className="habit-detail__hero-ring">
                <ProgressRing value={progress} size={128} stroke={11} color={color}>
                  <span className="habit-detail__ring-value">{habit.current_streak ?? 0}</span>
                  <span className="habit-detail__ring-label">day streak</span>
                </ProgressRing>
                <span className="habit-detail__ring-note">
                  {progress}% of your best ({habit.top_streak ?? 0})
                </span>
              </div>
            </div>

            <div className="habit-detail__stats">
              <div className="stat-pill">
                <span className="stat-pill__value">{habit.current_streak ?? 0}</span>
                <span className="stat-pill__label">Current streak</span>
              </div>
              <div className="stat-pill stat-pill--accent">
                <span className="stat-pill__value">{habit.top_streak ?? 0}</span>
                <span className="stat-pill__label">Best streak</span>
              </div>
              {isNumeric && habit.target_count != null && (
                <div className="stat-pill">
                  <span className="stat-pill__value">
                    {habit.target_count} {habit.unit || ''}
                  </span>
                  <span className="stat-pill__label">Daily target</span>
                </div>
              )}
              <div className="habit-detail__hero-actions">
                <button
                  className="btn btn-danger btn--sm"
                  onClick={handleHabitDelete}
                  disabled={deletingHabit}
                >
                  {deletingHabit ? 'Deleting…' : 'Delete habit'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Analytics: progress / history / calendar ---- */}
        <AnalyticsDashboard habitId={habit.id} />

        <div className="habit-detail__log-header">
          <h2>Log history</h2>
          <button className="btn btn-primary btn--sm" onClick={openCreateLog}>
            Log an entry
          </button>
        </div>

        {logs.length === 0 && (
          <div className="state">
            <p className="state__title">No entries yet</p>
            <p>Log today to start the chain.</p>
            <button className="btn btn-primary" onClick={openCreateLog}>
              Add your first entry
            </button>
          </div>
        )}

        {logs.length > 0 && (
          <ul className="habit-detail__log-list">
            {logs.map((log) => (
              <li key={log.id} className="log-row">
                <div className="log-row__date">{formatDate(log.date)}</div>
                <span
                  className={`badge log-row__status log-row__status--${
                    STATUS_CLASS[log.status] || 'done'
                  }`}
                >
                  {STATUS_LABEL[log.status] || log.status}
                </span>
                {isNumeric && log.value_achieved != null && (
                  <span className="log-row__value">
                    {log.value_achieved} {habit.unit || ''}
                  </span>
                )}
                {log.notes && <span className="log-row__notes">{log.notes}</span>}
                <div className="log-row__actions">
                  <button
                    className="icon-btn icon-btn--sm"
                    onClick={() => openEditLog(log)}
                    aria-label="Edit entry"
                    title="Edit"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    className="icon-btn icon-btn--sm icon-btn--danger"
                    onClick={() => handleLogDelete(log.id)}
                    disabled={deletingLogId === log.id}
                    aria-label="Delete entry"
                    title="Delete"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {editHabitOpen && (
          <HabitFormModal
            mode="edit"
            habit={habit}
            onClose={() => setEditHabitOpen(false)}
            onSaved={handleHabitSaved}
          />
        )}

        {logModal.open && (
          <LogFormModal
            mode={logModal.mode}
            habit={habit}
            log={logModal.log}
            onClose={closeLogModal}
            onSaved={handleLogSaved}
          />
        )}
      </div>
    </>
  );
}
