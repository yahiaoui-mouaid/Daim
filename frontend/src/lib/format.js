// src/lib/format.js
// Small, dependency-free formatting helpers shared across Momentum views.

/** Format an ISO date string as "Mon, Jan 5, 2026". */
export function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Short "MM-DD" label used by chart axes. */
export function shortDate(iso) {
  return iso ? iso.slice(5) : '';
}

/** Human-friendly time range for activity notes: "Jan 5, 9:00 AM → 10:30 AM". */
export function formatTimeRange(startIso, endIso) {
  if (!startIso || !endIso) return '';
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateOpts = { month: 'short', day: 'numeric' };
  const timeOpts = { hour: 'numeric', minute: '2-digit' };
  const sameDay = start.toDateString() === end.toDateString();

  const startLabel = `${start.toLocaleDateString([], dateOpts)}, ${start.toLocaleTimeString(
    [],
    timeOpts
  )}`;
  const endLabel = sameDay
    ? end.toLocaleTimeString([], timeOpts)
    : `${end.toLocaleDateString([], dateOpts)}, ${end.toLocaleTimeString([], timeOpts)}`;

  return `${startLabel} → ${endLabel}`;
}

/** "5 days ago" / "yesterday" / "today" style relative day labels. */
export function relativeDay(iso) {
  if (!iso) return '';
  const target = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today - target) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'Last week';
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  return formatDate(iso);
}

/** Pluralize a noun: pluralize(1, 'habit') -> "1 habit". */
export function pluralize(count, singular, plural) {
  const noun = count === 1 ? singular : plural || `${singular}s`;
  return `${count} ${noun}`;
}

/** ISO date (local) for today, in the user's timezone. */
export function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}
