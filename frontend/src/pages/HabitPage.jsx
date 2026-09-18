// src/pages/HabitPage.jsx
// Momentum habit board — summary ring, compounding stats, habit cards.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import HabitCard from '../components/HabitCard';
import HabitFormModal from '../components/HabitFormModal';
import ThemeToggle from '../components/ThemeToggle';
import MomentumAurora from '../components/MomentumAurora';
import StatPill from '../components/StatPill';
import ProgressRing from '../components/ProgressRing';
import { useAuth } from '../context/AuthContext';
import { useReveal, useRevealList } from '../hooks/useReveal';
import { deleteHabit, getHabit, getHabits, logHabit } from '../services/habits';
import {
  bestStreak,
  momentumScore,
  totalStreakDays,
} from '../lib/progress';
import '../styles/habit.css';

export default function HabitPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalState, setModalState] = useState({ open: false, mode: 'create', habit: null });
  const [deletingId, setDeletingId] = useState(null);
  const [loggingId, setLoggingId] = useState(null);

  // View mode state — 'cards' or 'list'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('habit-view') || 'cards';
  });

  const [summaryRef, summaryVisible] = useReveal();
  const [gridRef, gridVisible, gridDelays] = useRevealList(habits.length, 45);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('habit-view', viewMode);
  }, [viewMode]);

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'cards' ? 'list' : 'cards'));
  };

  const handleAuthFailure = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const loadHabits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHabits();
      setHabits(data);
    } catch (err) {
      if (err?.response?.status === 401) {
        handleAuthFailure();
        return;
      }
      setError(err.message || 'Could not load your habits.');
    } finally {
      setLoading(false);
    }
  }, [handleAuthFailure]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  // Momentum summary signals (pure, derived from the list payload)
  const summary = useMemo(() => {
    const active = habits.filter((h) => h.active !== false).length;
    return {
      score: momentumScore(habits),
      streakDays: totalStreakDays(habits),
      best: bestStreak(habits),
      active,
      total: habits.length,
    };
  }, [habits]);

  function openCreateModal() {
    setModalState({ open: true, mode: 'create', habit: null });
  }

  function openEditModal(habit) {
    setModalState({ open: true, mode: 'edit', habit });
  }

  function closeModal() {
    setModalState({ open: false, mode: 'create', habit: null });
  }

  function handleSaved(savedHabit) {
    setHabits((cur) => {
      const exists = cur.some((h) => h.id === savedHabit.id);
      return exists
        ? cur.map((h) => (h.id === savedHabit.id ? savedHabit : h))
        : [savedHabit, ...cur];
    });
    closeModal();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this habit? Its logs and streak history go with it.')) return;

    const previous = habits;
    setDeletingId(id);
    setHabits((cur) => cur.filter((h) => h.id !== id));

    try {
      await deleteHabit(id);
    } catch (err) {
      if (err?.response?.status === 401) {
        handleAuthFailure();
        return;
      }
      setHabits(previous);
      alert(err.message || 'Failed to delete the habit.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLog(habitId, { date, status, valueAchieved }) {
    setLoggingId(habitId);
    try {
      await logHabit(habitId, { date, status, valueAchieved });
      const refreshed = await getHabit(habitId);
      setHabits((cur) => cur.map((h) => (h.id === habitId ? refreshed : h)));
    } catch (err) {
      if (err?.response?.status === 401) {
        handleAuthFailure();
        return;
      }
      alert(err.message || "Failed to save today's log.");
    } finally {
      setLoggingId(null);
    }
  }

  return (
    <>
      <MomentumAurora />
      <Header />

      <main className="habits mt-page">
        {/* ---- Momentum summary ---- */}
        <section
          ref={summaryRef}
          className={`habits__summary card reveal ${summaryVisible ? 'is-visible' : ''}`}
        >
          <div className="habits__summary-main">
            <div className="habits__summary-copy">
              <span className="eyebrow">Your momentum</span>
              <h1 className="habits__title">Habits</h1>
              <p className="habits__subtitle">
                {habits.length === 0
                  ? 'Nothing tracked yet — your first habit starts the chain.'
                  : `${summary.streakDays} streak-days compounding across ${summary.active} active habit${
                      summary.active === 1 ? '' : 's'
                    }.`}
              </p>
            </div>

            <div className="habits__summary-actions">
              <button
                className="icon-btn habits__view-btn"
                onClick={toggleViewMode}
                aria-label={viewMode === 'cards' ? 'Switch to list view' : 'Switch to card view'}
                title={viewMode === 'cards' ? 'Switch to list view' : 'Switch to card view'}
              >
                {viewMode === 'cards' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                )}
              </button>

              <ThemeToggle />

              <button
                className="btn btn-primary habits__add-btn"
                onClick={openCreateModal}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New habit
              </button>
            </div>
          </div>

          <div className="habits__summary-stats">
            <div className="habits__ring">
              <ProgressRing
                value={habits.length ? summary.score : 0}
                size={104}
                stroke={9}
                label="Consistency"
              />
            </div>

            <div className="habits__pills">
              <StatPill
                accent
                label="Streak days"
                value={summary.streakDays}
                sub="compounding"
              />
              <StatPill label="Best streak" value={summary.best} sub="personal record" />
              <StatPill
                label="Active habits"
                value={`${summary.active}/${summary.total}`}
                sub="in rotation"
              />
            </div>
          </div>
        </section>

        {/* ---- States ---- */}
        {loading && (
          <div className="habits__grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ minHeight: 200 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="state state--error">
            <p className="state__title">Couldn’t load your habits</p>
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={loadHabits}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && habits.length === 0 && (
          <div className="state">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="var(--mt-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="18" r="14" transform="translate(-6 -6)" />
              <path d="M12 8v8l5 3" />
            </svg>
            <p className="state__title">No habits yet</p>
            <p>Start with one small rep. Momentum follows the first check-in.</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              Create your first habit
            </button>
          </div>
        )}

{/* Always render the container so the ref exists, conditionally render the contents */}
<div
  ref={gridRef}
  className={`habits__grid ${viewMode === 'list' ? 'habits__grid--list' : ''} reveal ${
    gridVisible ? 'is-visible' : ''
  }`}
>
  {!loading && !error && habits.length > 0 && habits.map((h, i) => (
    <HabitCard
      key={h.id}
      habit={h}
      onEdit={openEditModal}
      onDelete={handleDelete}
      onLog={handleLog}
      deleting={deletingId === h.id}
      logging={loggingId === h.id}
      style={{ transitionDelay: gridDelays[i] }}
    />
  ))}
</div>

        {modalState.open && (
          <HabitFormModal
            mode={modalState.mode}
            habit={modalState.habit}
            onClose={closeModal}
            onSaved={handleSaved}
          />
        )}
      </main>
    </>
  );
}
