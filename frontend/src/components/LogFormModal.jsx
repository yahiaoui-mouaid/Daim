// src/components/LogFormModal.jsx
import { useEffect, useState } from 'react';
import { logHabit, updateHabitLog } from '../services/habits';
import { todayISO } from '../lib/format';
import '../styles/HabitFormModal.css';

export default function LogFormModal({ mode, habit, log, onClose, onSaved }) {
  const isNumeric = habit.tracking_type === 'NUMERIC';

  const [date, setDate] = useState(log?.date || todayISO());
  const [status, setStatus] = useState(log?.status || 'COMPLETED');
  const [valueAchieved, setValueAchieved] = useState(
    log?.value_achieved != null ? String(log.value_achieved) : ''
  );
  const [notes, setNotes] = useState(log?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      date,
      status,
      valueAchieved: isNumeric && valueAchieved !== '' ? Number(valueAchieved) : null,
      notes: notes.trim(),
    };

    try {
      const saved = mode === 'edit'
        ? await updateHabitLog(habit.id, log.id, payload)
        : await logHabit(habit.id, payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="habit-modal__overlay" onClick={onClose}>
      <div className="habit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="habit-modal__header">
          <h2>{mode === 'edit' ? 'Edit entry' : 'Log an entry'}</h2>
          <button type="button" className="habit-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="habit-modal__form" onSubmit={handleSubmit}>
          <label className="habit-modal__field">
            <span>Date</span>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <div className="habit-modal__row">
            <label className="habit-modal__field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="COMPLETED">Completed</option>
                <option value="SKIPPED">Skipped</option>
                <option value="MISSED">Missed</option>
              </select>
            </label>

            {isNumeric && (
              <label className="habit-modal__field">
                <span>Amount {habit.unit ? `(${habit.unit})` : ''}</span>
                <input
                  type="number"
                  min="0"
                  value={valueAchieved}
                  onChange={(e) => setValueAchieved(e.target.value)}
                  placeholder={habit.target_count != null ? String(habit.target_count) : ''}
                />
              </label>
            )}
          </div>

          <label className="habit-modal__field">
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering (optional)"
              rows={2}
            />
          </label>

          {error && <p className="habit-modal__error">{error}</p>}

          <div className="habit-modal__buttons">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

