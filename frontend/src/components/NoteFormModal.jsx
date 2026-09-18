// src/components/NoteFormModal.jsx

import { useEffect, useRef, useState } from 'react';
import { createNote, getCurrentUser, updateNote } from '../services/notes';
import { useAuth } from '../context/AuthContext';

function toLocalInputValue(iso) {
  if (!iso) return '';

  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function toIsoString(localValue) {
  return new Date(localValue).toISOString();
}

function fileLabel(url) {
  try {
    return decodeURIComponent(url.split('/').pop());
  } catch {
    return url;
  }
}

function isImageFile(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
}

function isPdfFile(url) {
  return /\.pdf$/i.test(url);
}

export default function NoteFormModal({ mode, note, onClose, onSaved }) {
  const isEdit = mode === 'edit';

  const { accessToken } = useAuth();

  const [startTime, setStartTime] = useState(
    toLocalInputValue(note?.start_time)
  );
  const [endTime, setEndTime] = useState(
    toLocalInputValue(note?.end_time)
  );
  const [text, setText] = useState(note?.note ?? '');

  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [fileUrls, setFileUrls] = useState({});
  const [previewFile, setPreviewFile] = useState(null);

  const fileInputRef = useRef(null);

  const existingFiles = note?.files ?? [];

  /*
   * Load existing attachments using the access token.
   *
   * We cannot simply use:
   *   <img src={f.file} />
   *
   * because that request would bypass our Axios interceptor.
   *
   * Instead:
   *   Django file URL
   *        ↓
   *   authenticated fetch()
   *        ↓
   *   Blob
   *        ↓
   *   blob: URL
   */
  useEffect(() => {
    if (!accessToken || existingFiles.length === 0) {
      setFileUrls({});
      return;
    }

    let cancelled = false;
    const objectUrls = [];

    async function loadFiles() {
      const loadedUrls = {};

      for (const file of existingFiles) {
        try {
          const response = await fetch(file.file, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            throw new Error(
              `Failed to load attachment (${response.status})`
            );
          }

          const blob = await response.blob();

          const objectUrl = URL.createObjectURL(blob);

          objectUrls.push(objectUrl);
          loadedUrls[file.id] = objectUrl;
        } catch (err) {
          console.error(
            `Failed to load attachment: ${file.file}`,
            err
          );
        }
      }

      if (!cancelled) {
        setFileUrls(loadedUrls);
      }
    }

    loadFiles();

    return () => {
      cancelled = true;

      objectUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [accessToken, note?.id]);

  function handleFilesPicked(e) {
    const picked = Array.from(e.target.files || []);

    setNewFiles((cur) => [...cur, ...picked]);

    // Allows selecting the same file again later.
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();

    const dropped = Array.from(e.dataTransfer.files || []);

    if (dropped.length) {
      setNewFiles((cur) => [...cur, ...dropped]);
    }
  }

  function removeNewFile(index) {
    setNewFiles((cur) => cur.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!startTime || !endTime) {
      setError('Please set both a start and end time.');
      return;
    }

    if (new Date(startTime) > new Date(endTime)) {
      setError('Start time must be before end time.');
      return;
    }

    if (!text.trim()) {
      setError('Please write a note before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        startTime: toIsoString(startTime),
        endTime: toIsoString(endTime),
        note: text.trim(),
        files: newFiles,
      };

      const saved = isEdit
        ? await updateNote(note.id, payload)
        : await createNote({
            ...payload,
            userId: (await getCurrentUser()).id,
          });

      onSaved(saved);
    } catch (err) {
      setError(
        err.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  function openPreview(file) {
    const url = fileUrls[file.id];

    if (!url) {
      return;
    }

    setPreviewFile({
      url,
      name: fileLabel(file.file),
      type: isImageFile(file.file) ? 'image' : 'file',
      isPdf: isPdfFile(file.file),
    });
  }

  return (
    <div
      className="modal-backdrop active"
      onClick={onClose}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{isEdit ? 'Edit Activity' : 'Log Activity'}</h3>

        {/* Start / End Time */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start-time">
              Start Time
            </label>

            <input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="end-time">
              End Time
            </label>

            <input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {/* Activity Details */}
        <div className="form-group">
          <label htmlFor="note-text">
            Activity Details
          </label>

          <textarea
            id="note-text"
            placeholder="Describe what you accomplished during this time..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* Existing Attachments */}
        {existingFiles.length > 0 && (
          <div className="form-group">
            <label>Existing Attachments</label>

            <div className="existing-attachments">
              {existingFiles.map((file) => {
                const previewUrl = fileUrls[file.id];
                const name = fileLabel(file.file);
                const isImage = isImageFile(file.file);

                return (
                  <div
                    key={file.id}
                    className="existing-attachment"
                  >
                    {isImage ? (
                      <button
                        type="button"
                        className="existing-attachment__image-button"
                        onClick={() => openPreview(file)}
                        disabled={!previewUrl}
                        title={
                          previewUrl
                            ? `Preview ${name}`
                            : `Loading ${name}...`
                        }
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={name}
                            className="existing-attachment__image"
                          />
                        ) : (
                          <div className="existing-attachment__loading">
                            Loading...
                          </div>
                        )}

                        <span className="existing-attachment__name">
                          {name}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="existing-attachment__file"
                        onClick={() => openPreview(file)}
                        disabled={!previewUrl}
                        title={
                          previewUrl
                            ? `Open ${name}`
                            : `Loading ${name}...`
                        }
                      >
                        <span className="existing-attachment__icon">
                          {isPdfFile(file.file) ? '📄' : '📎'}
                        </span>

                        <span>
                          {previewUrl
                            ? name
                            : `Loading ${name}...`}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upload New Files */}
        <div className="form-group">
          <label>Attach Files</label>

          <div
            className="upload-box"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <span>
              📎 Click or drag files here to attach
            </span>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFilesPicked}
            />
          </div>

          {newFiles.length > 0 && (
            <ul className="file-list file-list--new">
              {newFiles.map((file, index) => (
                <li key={`${file.name}-${index}`}>
                  <span>{file.name}</span>

                  <button
                    type="button"
                    className="file-list__remove"
                    onClick={() => removeNewFile(index)}
                    aria-label={`Remove ${file.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Note'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </div>

        {/* File Preview */}
        {previewFile && (
          <div
            className="file-preview-backdrop"
            onClick={() => setPreviewFile(null)}
          >
            <div
              className="file-preview"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="file-preview__header">
                <span>{previewFile.name}</span>

                <button
                  type="button"
                  className="file-preview__close"
                  onClick={() => setPreviewFile(null)}
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>

              <div className="file-preview__content">
                {previewFile.type === 'image' ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="file-preview__image"
                  />
                ) : (
                  <iframe
                    src={previewFile.url}
                    title={previewFile.name}
                    className="file-preview__iframe"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}