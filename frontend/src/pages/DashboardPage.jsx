// src/pages/DashboardPage.jsx
// Momentum activity log — summary strip, filters, note cards.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import NoteCard from '../components/NoteCard';
import NoteFormModal from '../components/NoteFormModal';
import ProgressRing from '../components/ProgressRing';
import StatPill from '../components/StatPill';
import MomentumAurora from '../components/MomentumAurora';
import { deleteNote, getNotes } from '../services/notes';
import { weeklyActivity } from '../lib/progress';
import { relativeDay } from '../lib/format';
import '../styles/Dashboard.css';

// Debounce helper
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Convert granularity + value to backend's start_date / end_date
function buildDateFilter(granularity, value) {
  if (!value) return { start_date: undefined, end_date: undefined };

  let start, end;
  const date = new Date(value);
  if (isNaN(date.getTime())) return { start_date: undefined, end_date: undefined };

  switch (granularity) {
    case 'day':
      start = new Date(date);
      start.setHours(0, 0, 0, 0);
      end = new Date(date);
      end.setHours(23, 59, 59, 999);
      break;

    case 'month':
      start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case 'year':
      start = new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    default:
      return { start_date: undefined, end_date: undefined };
  }

  return {
    start_date: start.toISOString(),
    end_date: end.toISOString(),
  };
}

export default function DashboardPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalState, setModalState] = useState({ open: false, mode: 'create', note: null });
  const [deletingId, setDeletingId] = useState(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [granularity, setGranularity] = useState('day'); // 'day' | 'month' | 'year'
  const [dateValue, setDateValue] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  // Load notes with filters
  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { start_date, end_date } = buildDateFilter(granularity, dateValue);

      const params = {
        search: debouncedSearch || undefined,
        start_date,
        end_date,
      };

      const data = await getNotes(params);
      const sorted = [...data].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      setNotes(sorted);
    } catch (err) {
      setError(err.message || 'Could not load notes.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, granularity, dateValue]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Derived summary signals
  const summary = useMemo(() => {
    const attachments = notes.reduce((sum, n) => sum + (n.files?.length || 0), 0);
    const latest = notes[0];
    return {
      activity: weeklyActivity(notes),
      entries: notes.length,
      attachments,
      latest: latest ? relativeDay(latest.start_time) : '—',
    };
  }, [notes]);

  // Handlers
  const handleGranularityChange = (e) => {
    setGranularity(e.target.value);
    setDateValue(''); // clear value when switching modes
  };

  const clearFilters = () => {
    setSearch('');
    setGranularity('day');
    setDateValue('');
  };

  function openCreateModal() {
    setModalState({ open: true, mode: 'create', note: null });
  }
  function openEditModal(note) {
    setModalState({ open: true, mode: 'edit', note });
  }
  function closeModal() {
    setModalState({ open: false, mode: 'create', note: null });
  }
  async function handleDelete(id) {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    const previous = notes;
    setDeletingId(id);
    setNotes((cur) => cur.filter((n) => n.id !== id));
    try {
      await deleteNote(id);
    } catch (err) {
      setNotes(previous);
      alert(err.message || 'Failed to delete the note.');
    } finally {
      setDeletingId(null);
    }
  }
  function handleSaved(savedNote) {
    setNotes((cur) => {
      const exists = cur.some((n) => n.id === savedNote.id);
      const next = exists
        ? cur.map((n) => (n.id === savedNote.id ? savedNote : n))
        : [savedNote, ...cur];
      return [...next].sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    });
    closeModal();
  }

  const filtersActive = search || dateValue;

  return (
    <>
      <MomentumAurora />
      <Header />

      <div className="dash mt-page">
        {/* ---- Summary strip ---- */}
        <header className="dash__summary card">
          <div className="dash__summary-main">
            <span className="eyebrow">Activity log</span>
            <h1 className="dash__title">Your week in motion</h1>
            <p className="dash__subtitle">
              {summary.entries} {summary.entries === 1 ? 'entry' : 'entries'} tracked
              {summary.attachments ? ` · ${summary.attachments} attachments` : ''}
            </p>
          </div>

          <div className="dash__summary-stats">
            <div className="dash__ring">
              <ProgressRing value={summary.activity} size={100} stroke={9} label="This week" />
            </div>
            <div className="dash__pills">
              <StatPill accent label="Entries" value={summary.entries} sub="logged" />
              <StatPill label="Last entry" value={summary.latest} sub="activity" />
            </div>
            <button
              className="btn btn-primary dash__add-btn"
              onClick={openCreateModal}
              aria-label="Add note"
              title="Add note"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Log activity
            </button>
          </div>
        </header>

        {/* ---- FILTER BAR ---- */}
        <div className="dash__filters">
          <div className="dash__search">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input filter-input--search"
            />
          </div>

          <select
            value={granularity}
            onChange={handleGranularityChange}
            className="filter-select"
          >
            <option value="day">Day</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>

          <input
            type={granularity === 'day' ? 'date' : granularity === 'month' ? 'month' : 'number'}
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            placeholder={granularity === 'year' ? 'e.g. 2026' : ''}
            className="filter-input"
            min={granularity === 'year' ? '2000' : undefined}
            max={granularity === 'year' ? '2100' : undefined}
          />

          <button
            className="btn btn-secondary btn--sm"
            onClick={clearFilters}
            disabled={!filtersActive}
          >
            Clear filters
          </button>
        </div>

        {/* ---- States ---- */}
        {loading && (
          <div className="dash__grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ minHeight: 150 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="state state--error">
            <p className="state__title">Couldn’t load your notes</p>
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={loadNotes}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && notes.length === 0 && (
          <div className="state">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="var(--mt-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="13" x2="12" y2="17" />
              <line x1="10" y1="15" x2="14" y2="15" />
            </svg>
            <p className="state__title">No entries yet</p>
            <p>Log what you did today — future you will thank you.</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              Log your first activity
            </button>
          </div>
        )}

        {!loading && !error && notes.length > 0 && (
          <div className="dash__grid">
            {notes.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onClick={() => openEditModal(n)}
                onDelete={() => handleDelete(n.id)}
                deleting={deletingId === n.id}
              />
            ))}
          </div>
        )}

        {modalState.open && (
          <NoteFormModal mode={modalState.mode} note={modalState.note} onClose={closeModal} onSaved={handleSaved} />
        )}
      </div>
    </>
  );
}
