// src/components/StatPill.jsx
// A compact stat block used across dashboard summaries.

export default function StatPill({ label, value, sub, accent = false, className = '' }) {
  return (
    <div className={`stat-pill ${accent ? 'stat-pill--accent' : ''} ${className}`.trim()}>
      <span className="stat-pill__value">{value}</span>
      <span className="stat-pill__label">{label}</span>
      {sub && <span className="stat-pill__sub">{sub}</span>}
    </div>
  );
}
