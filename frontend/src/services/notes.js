// src/services/notes.js
//
// Talks to the existing Django/DRF notes endpoints via the app's shared
// axios instance (src/api.js default export). That instance already
// attaches the Bearer access token from localStorage and sends the
// refresh cookie via withCredentials: true — nothing extra needed here.
import api from '../api';

const NOTES_BASE = '/api/notes';

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

/** GET /api/auth/users/me/ — current authenticated user (Djoser). */
export async function getCurrentUser() {
  try {
    const res = await api.get('/api/auth/users/me/');
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Could not load your account.'));
  }
}

/** GET /api/notes/ — list all notes for the current user. */
export async function getNotes(params = {}) {
  // Remove empty values
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== '')
  );
  const query = new URLSearchParams(cleaned).toString();
  const url = `/api/notes/${query ? `?${query}` : ''}`;
  const response = await api.get(url);
  return response.data;
}

/**
 * POST /api/notes/create/
 * Multipart because file uploads are involved. `files` is an array of
 * File objects from an <input type="file" multiple> element. Axios sets
 * the multipart boundary automatically when the body is FormData.
 */
export async function createNote({ startTime, endTime, note, files, userId }) {
  const formData = new FormData();
  formData.append('user', userId);
  formData.append('start_time', startTime);
  formData.append('end_time', endTime);
  formData.append('note', note);
  files.forEach((file) => formData.append('uploaded_files', file));

  try {
    const res = await api.post(`${NOTES_BASE}/create/`, formData);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to save the note.'));
  }
}

/**
 * PATCH /api/notes/<id>/update/
 * `files`, if provided, are newly attached files to add to the note.
 */
export async function updateNote(id, { startTime, endTime, note, files }) {
  const formData = new FormData();
  formData.append('start_time', startTime);
  formData.append('end_time', endTime);
  formData.append('note', note);
  (files || []).forEach((file) => formData.append('uploaded_files', file));

  try {
    const res = await api.patch(`${NOTES_BASE}/${id}/update/`, formData);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to update the note.'));
  }
}

/** DELETE /api/notes/<id>/delete/ */
export async function deleteNote(id) {
  try {
    await api.delete(`${NOTES_BASE}/${id}/delete/`);
  } catch (err) {
    throw new Error(extractErrorMessage(err, 'Failed to delete the note.'));
  }
}


