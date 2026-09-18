// src/components/HabitFormModal.jsx
import { useEffect, useState } from 'react';
import { createHabit, updateHabit } from '../services/habits';
import '../styles/HabitFormModal.css';

const DEFAULT_COLOR = '#5b7fff';

function emptyForm() {
  return {
    name: '',
    description: '',
    frequency: 'DAILY',
    tracking_type: 'BOOLEAN',
    target_count: 1,
    unit: '',
    active: true,
    color_hex: DEFAULT_COLOR,
  };
}

export default function HabitFormModal({ mode, habit, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mode === 'edit' && habit) {
      setForm({
        name: habit.name || '',
        description: habit.description || '',
        frequency: habit.frequency || 'DAILY',
        tracking_type: habit.tracking_type || 'BOOLEAN',
        target_count: habit.target_count ?? 1,
        unit: habit.unit || '',
        active: habit.active !== false,
        color_hex: habit.color_hex && habit.color_hex.trim() ? habit.color_hex : DEFAULT_COLOR,
      });
    }
  }, [mode, habit]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Give this habit a name.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      frequency: form.frequency,
      tracking_type: form.tracking_type,
      target_count: form.tracking_type === 'NUMERIC' ? Number(form.target_count) || 1 : 1,
      unit: form.tracking_type === 'NUMERIC' ? form.unit.trim() : '',
      active: form.active,
      color_hex: form.color_hex,
    };

    try {
      const saved = mode === 'edit'
        ? await updateHabit(habit.id, payload)
        : await createHabit(payload);
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
          <h2>{mode === 'edit' ? 'Edit habit' : 'New habit'}</h2>
          <button type="button" className="habit-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="habit-modal__form" onSubmit={handleSubmit}>
          <label className="habit-modal__field">
            <span>Name</span>
            <input
              type="text"
              value={form.name}
              maxLength={100}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Drink water"
              autoFocus
            />
          </label>

          <label className="habit-modal__field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Why this habit matters to you (optional)"
              rows={2}
            />
          </label>

          <div className="habit-modal__row">
            <label className="habit-modal__field">
              <span>Frequency</span>
              <select value={form.frequency} onChange={(e) => update('frequency', e.target.value)}>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </label>

            <label className="habit-modal__field">
              <span>Tracking</span>
              <select value={form.tracking_type} onChange={(e) => update('tracking_type', e.target.value)}>
                <option value="BOOLEAN">Done / not done</option>
                <option value="NUMERIC">Numeric count</option>
              </select>
            </label>
          </div>

          {form.tracking_type === 'NUMERIC' && (
            <div className="habit-modal__row">
              <label className="habit-modal__field">
                <span>Target</span>
                <input
                  type="number"
                  min="1"
                  value={form.target_count}
                  onChange={(e) => update('target_count', e.target.value)}
                />
              </label>
              <label className="habit-modal__field">
                <span>Unit</span>
                <input
                  type="text"
                  maxLength={50}
                  value={form.unit}
                  onChange={(e) => update('unit', e.target.value)}
                  placeholder="glasses, pages…"
                />
              </label>
            </div>
          )}

          <div className="habit-modal__row habit-modal__row--align">
            <label className="habit-modal__field habit-modal__field--color">
              <span>Color</span>
              <input
                type="color"
                value={form.color_hex}
                onChange={(e) => update('color_hex', e.target.value)}
              />
            </label>

            <label className="habit-modal__checkbox">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => update('active', e.target.checked)}
              />
              <span>Active</span>
            </label>
          </div>

          {error && <p className="habit-modal__error">{error}</p>}

          <div className="habit-modal__buttons">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
