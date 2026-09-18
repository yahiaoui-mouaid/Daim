// src/components/NoteCard.jsx
import { formatTimeRange } from '../lib/format';

export default function NoteCard({ note, onClick, onDelete, deleting }) {
  const fileCount = note.files?.length || 0;

  return (
    <div
      className={`note-card${deleting ? ' note-card--deleting' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
    >
      <button
        className="note-card__delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={deleting}
        aria-label="Delete note"
        title="Delete note"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </svg>
      </button>

      <div className="note-card__time">{formatTimeRange(note.start_time, note.end_time)}</div>
      <p className="note-card__text">{note.note}</p>

      {fileCount > 0 && (
        <div className="note-card__files">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L9.94 17.32a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          {fileCount} attachment{fileCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

