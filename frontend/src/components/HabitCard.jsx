// src/components/HabitCard.jsx
// Momentum habit card — a mini ring shows progress toward the personal
// best, and one-tap logging keeps the chain going.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressRing from './ProgressRing';
import { streakProgress } from '../lib/progress';
import { todayISO } from '../lib/format';
import '../styles/HabitCard.css';

const FREQUENCY_LABEL = { DAILY: 'Daily', WEEKLY: 'Weekly' };

export default function HabitCard({ habit, onEdit, onDelete, onLog, deleting, logging, style }) {
  const navigate = useNavigate();
  const [numericValue, setNumericValue] = useState(
    habit.tracking_type === 'NUMERIC' && habit.target_count ? String(habit.target_count) : ''
  );

  const isNumeric = habit.tracking_type === 'NUMERIC';
  const color = habit.color_hex && habit.color_hex.trim() ? habit.color_hex : '#10b981';
  const progress = streakProgress(habit);

  function handleLog(status) {
    onLog(habit.id, {
      date: todayISO(),
      status,
      valueAchieved:
        isNumeric && status === 'COMPLETED' && numericValue !== '' ? Number(numericValue) : null,
    });
  }

  function openDetail() {
    navigate(`/habits/${habit.id}`);
  }

  return (
    <div
      className={`habit-card${habit.active === false ? ' habit-card--inactive' : ''}`}
      style={{ '--habit-color': color, ...style }}
    >
      <button
        type="button"
        className="habit-card__body"
        onClick={openDetail}
        aria-label={`Open ${habit.name} details`}
      >
        <div className="habit-card__top">
          <h3 className="habit-card__name">{habit.name}</h3>
          <span className="habit-card__freq">
            {FREQUENCY_LABEL[habit.frequency] || habit.frequency}
          </span>
        </div>

        {habit.description && <p className="habit-card__desc">{habit.description}</p>}

        <div className="habit-card__streaks">
          <div className="habit-card__streak">
            <span className="habit-card__streak-value">{habit.current_streak ?? 0}</span>
            <span className="habit-card__streak-label">current</span>
          </div>
          <div className="habit-card__streak habit-card__streak--best">
            <span className="habit-card__streak-value">{habit.top_streak ?? 0}</span>
            <span className="habit-card__streak-label">best</span>
          </div>
        </div>
      </button>

      {/* Mini ring: progress toward the personal best */}
      <div className="habit-card__ring" aria-hidden="true">
        <ProgressRing
          value={progress}
          size={58}
          stroke={6}
          color={color}
          delay={200}
          label=""
        >
          <span className="habit-card__ring-value">{progress}%</span>
        </ProgressRing>
      </div>

      <div className="habit-card__log">
        {isNumeric && (
          <div className="habit-card__numeric">
            <input
              type="number"
              min="0"
              className="habit-card__numeric-input"
              value={numericValue}
              onChange={(e) => setNumericValue(e.target.value)}
              aria-label={`Amount for ${habit.name}`}
              disabled={logging}
            />
            {habit.unit && <span className="habit-card__unit">{habit.unit}</span>}
            {habit.target_count != null && (
              <span className="habit-card__target">/ {habit.target_count}</span>
            )}
          </div>
        )}

        <div className="habit-card__actions">
          <button
            type="button"
            className="habit-card__log-btn"
            onClick={() => handleLog('COMPLETED')}
            disabled={logging}
          >
            {logging ? 'Saving…' : isNumeric ? 'Log today' : 'Mark done'}
          </button>
          <button
            type="button"
            className="habit-card__log-link"
            onClick={() => handleLog('SKIPPED')}
            disabled={logging}
          >
            Skip
          </button>
          <button
            type="button"
            className="habit-card__log-link"
            onClick={() => handleLog('MISSED')}
            disabled={logging}
          >
            Missed
          </button>
        </div>
      </div>

      <div className="habit-card__footer">
        <button
          type="button"
          className="icon-btn icon-btn--sm"
          onClick={() => onEdit(habit)}
          aria-label="Edit habit"
          title="Edit habit"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--sm icon-btn--danger"
          onClick={() => onDelete(habit.id)}
          disabled={deleting}
          aria-label="Delete habit"
          title="Delete"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
