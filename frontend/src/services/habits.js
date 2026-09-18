// src/services/habits.js
//
// Talks to the existing Django/DRF habits endpoints via the app's shared
// axios instance (src/api.js default export). That instance already
// attaches the Bearer access token from AuthContext state and sends the
// refresh cookie via withCredentials: true — nothing extra needed here.
import api from '../api';

const HABITS_BASE = '/api/habits';

function extractErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (typeof data?.detail === 'string') return data.detail;
  if (data && typeof data === 'object') {
    const firstField = Object.values(data)[0];
    if (Array.isArray(firstField)) return firstField[0];
    if (typeof firstField === 'string') return firstField;
  }
  return err?.message || fallback;
}

/** GET /api/habits/ — list all habits belonging to the current user. */
export async function getHabits() {
  try {
    const res = await api.get(`${HABITS_BASE}/`);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Could not load your habits.'));
  }
}

/** GET /api/habits/<id>/ — single habit, includes recent_logs + streak_history. */
export async function getHabit(id) {
  try {
    const res = await api.get(`${HABITS_BASE}/${id}/`);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Could not load that habit.'));
  }
}

/** POST /api/habits/ — create a new habit. */
export async function createHabit(payload) {
  try {
    const res = await api.post(`${HABITS_BASE}/`, payload);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to create the habit.'));
  }
}

/** PATCH /api/habits/<id>/ — update an existing habit (partial). */
export async function updateHabit(id, payload) {
  try {
    const res = await api.patch(`${HABITS_BASE}/${id}/`, payload);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to update the habit.'));
  }
}

/** DELETE /api/habits/<id>/ */
export async function deleteHabit(id) {
  try {
    await api.delete(`${HABITS_BASE}/${id}/`);
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to delete the habit.'));
  }
}

/** GET /api/habits/<habit_id>/logs/ — all logs for one habit. */
export async function getHabitLogs(habitId) {
  try {
    const res = await api.get(`${HABITS_BASE}/${habitId}/logs/`);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Could not load logs for this habit.'));
  }
}

/**
 * POST /api/habits/<habit_id>/logs/ — create/update the log for a date.
 * The backend upserts: posting the same date again just updates that entry,
 * so this doubles as "log today" and "edit today's log".
 */
export async function logHabit(habitId, { date, status, valueAchieved, notes }) {
  try {
    const res = await api.post(`${HABITS_BASE}/${habitId}/logs/`, {
      date,
      status,
      value_achieved: valueAchieved ?? null,
      notes: notes ?? '',
    });
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, "Failed to save today's log."));
  }
}

/** GET /api/habits/<habit_id>/logs/<log_id>/ — a single log entry. */
export async function getHabitLog(habitId, logId) {
  try {
    const res = await api.get(`${HABITS_BASE}/${habitId}/logs/${logId}/`);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Could not load that log entry.'));
  }
}

/** PATCH /api/habits/<habit_id>/logs/<log_id>/ — edit an existing log entry by id. */
export async function updateHabitLog(habitId, logId, { date, status, valueAchieved, notes }) {
  try {
    const res = await api.patch(`${HABITS_BASE}/${habitId}/logs/${logId}/`, {
      date,
      status,
      value_achieved: valueAchieved ?? null,
      notes: notes ?? '',
    });
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to update that log entry.'));
  }
}

/** DELETE /api/habits/<habit_id>/logs/<log_id>/ */
export async function deleteHabitLog(habitId, logId) {
  try {
    await api.delete(`${HABITS_BASE}/${habitId}/logs/${logId}/`);
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to delete that log entry.'));
  }
}