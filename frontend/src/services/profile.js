// src/services/profile.js

import api from '../api';

const PROFILE_BASE = '/api/auth/users';

function extractErrorMessage(err, fallback) {
  const data = err?.response?.data;

  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  if (data && typeof data === 'object') {
    const firstField = Object.values(data)[0];

    if (Array.isArray(firstField)) {
      return firstField[0];
    }

    if (typeof firstField === 'string') {
      return firstField;
    }
  }

  return err?.message || fallback;
}

function throwProfileError(err, fallback) {
  const error = new Error(extractErrorMessage(err, fallback));

  error.status = err?.response?.status;

  throw error;
}

/**
 * GET /api/auth/users/me/
 * Returns the currently authenticated user.
 */
export async function getCurrentUser() {
  try {
    const res = await api.get(`${PROFILE_BASE}/me/`);
    return res.data;
  } catch (err) {
    throwProfileError(err, 'Could not load your profile.');
  }
}

/**
 * PATCH /api/auth/users/<id>/
 * Updates the authenticated user's profile.
 */
export async function updateProfile(id, data) {
  try {
    const res = await api.patch(`${PROFILE_BASE}/${id}/`, data);
    return res.data;
  } catch (err) {
    throwProfileError(err, 'Could not update your profile.');
  }
}

/**
 * DELETE /api/auth/users/<id>/
 * Permanently deletes the user account.
 */
export async function deleteProfile(id) {
  try {
    await api.delete(`${PROFILE_BASE}/${id}/`);
  } catch (err) {
    throwProfileError(err, 'Could not delete your account.');
  }
}