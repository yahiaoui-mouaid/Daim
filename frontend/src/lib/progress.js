// src/lib/progress.js
// Derives Momentum progress signals (0-100) from habit / note data.
// Pure functions only — no API calls, no side effects.

const STATUS_VALUE = {
  COMPLETED: 100,
  PARTIAL: 50,
  SKIPPED: 0,
  MISSED: 0,
};

/**
 * Consistency of a single habit: how far the current streak has climbed
 * toward the personal best. Compounding-friendly — a new habit at the
 * start of its journey still shows an honest, small number.
 */
export function streakProgress(habit) {
  const current = Number(habit?.current_streak ?? 0);
  const best = Number(habit?.top_streak ?? 0);
  if (best <= 0) return current > 0 ? 100 : 0;
  return Math.min(100, Math.round((current / best) * 100));
}

/**
 * Portfolio consistency across all habits: the average of each habit's
 * streak progress. Used by the HabitPage momentum summary ring.
 */
export function momentumScore(habits = []) {
  if (!Array.isArray(habits) || habits.length === 0) return 0;
  const total = habits.reduce((sum, h) => sum + streakProgress(h), 0);
  return Math.round(total / habits.length);
}

/** Total compounding streak-days across every habit. */
export function totalStreakDays(habits = []) {
  return habits.reduce((sum, h) => sum + Number(h?.current_streak ?? 0), 0);
}

/** Best single streak across every habit. */
export function bestStreak(habits = []) {
  return habits.reduce((best, h) => Math.max(best, Number(h?.top_streak ?? 0)), 0);
}

/** Completion percentage of the last N logged entries (any status). */
export function completionRate(logs = []) {
  if (!Array.isArray(logs) || logs.length === 0) return 0;
  const done = logs.filter((l) => l?.status === 'COMPLETED').length;
  return Math.round((done / logs.length) * 100);
}

/** Numeric progress toward a daily target, clamped to 100. */
export function numericProgress(value, target) {
  const v = Number(value ?? 0);
  const t = Number(target ?? 0);
  if (t <= 0) return v > 0 ? 100 : 0;
  return Math.min(100, Math.round((v / t) * 100));
}

/** Weekly activity from notes: fraction of the last 7 days with an entry. */
export function weeklyActivity(notes = []) {
  if (!Array.isArray(notes) || notes.length === 0) return 0;
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - 7);

  const days = new Set(
    notes
      .filter((n) => new Date(n.start_time) >= cutoff)
      .map((n) => new Date(n.start_time).toDateString())
  );
  return Math.min(100, Math.round((days.size / 7) * 100));
}

export { STATUS_VALUE };
