// src/components/AnalyticsDashboard.jsx
//
// Single-file bundle containing:
//   1. CalendarHeatmap
//   2. HistoryChart
//   3. LineChart
//   4. AnalyticsDashboard  (default export)
//
// NOTE: ThemeToggle lives in its own file (src/components/ThemeToggle.jsx)
// and is imported separately by HabitDetailPage — it was removed from here
// to avoid having two competing copies of the same component.

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getHabitLogs } from '../services/habits';

/* ==========================================================================
 * Helpers to derive progress/history series from raw logs
 * ========================================================================== */

function statusToValue(status) {
  if (status === 'COMPLETED') return 100;
  if (status === 'PARTIAL') return 50;
  return 0;
}

function filterLogsByPeriod(logs, period) {
  if (!Array.isArray(logs) || logs.length === 0) return [];

  const now = new Date();
  const cutoff = new Date(now);

  if (period === 'week') {
    cutoff.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    cutoff.setMonth(now.getMonth() - 1);
  } else {
    cutoff.setFullYear(now.getFullYear() - 1);
  }

  return logs.filter((l) => new Date(l.date) >= cutoff);
}

function logsToProgressPoints(logs) {
  return [...logs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((l) => ({
      label: l.date.slice(5), // MM-DD
      value: statusToValue(l.status),
    }));
}

function logsToHistoryBuckets(logs) {
  return [...logs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((l) => ({
      id: l.id ?? l.date,
      label: l.date.slice(5), // MM-DD
      value: statusToValue(l.status),
    }));
}

// Convert API logs to Map<date, status>
function logsToStatusMap(logs) {
  return new Map(logs.map((log) => [log.date, log.status]));
}

/* ==========================================================================
 * 1. CalendarHeatmap
 * ========================================================================== */

const STATUS_CLASS = {
  COMPLETED: 'done',
  PARTIAL: 'partial',
  MISSED: 'missed',
  SKIPPED: 'missed',
};

const STATUS_LABEL = {
  COMPLETED: 'Completed',
  PARTIAL: 'Partial',
  MISSED: 'Missed',
  SKIPPED: 'Skipped',
};


const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function CalendarHeatmap({ statusMap, initialYear }) {
  const [year, setYear] = useState(initialYear);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setYear(initialYear);
  }, [initialYear]);

  const months = useMemo(() => {
    const today = new Date();
    const todayISO =
      `${today.getFullYear()}-` +
      `${String(today.getMonth() + 1).padStart(2, '0')}-` +
      `${String(today.getDate()).padStart(2, '0')}`;

    return Array.from({ length: 12 }, (_, m) => {
      const first = new Date(year, m, 1);
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      const leading = first.getDay();

      const cells = Array(leading).fill(null);

      for (let d = 1; d <= daysInMonth; d++) {
        const iso =
          `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const status = statusMap?.get(iso) ?? null;
        cells.push({ iso, day: d, status, isToday: iso === todayISO });
      }

      while (cells.length % 7 !== 0) cells.push(null);

      return { label: MONTHS[m], cells };
    });
  }, [year, statusMap]);

  return (
    <div>
      {/* ==================== Year navigation ==================== */}
      <div className="hd-cal__nav">
        <button
          className="hd-icon-btn hd-icon-btn--sm"
          onClick={() => { setSelected(null); setYear((y) => y - 1); }}
          aria-label="Previous year"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span className="hd-cal__month" aria-live="polite">{year}</span>

        <button
          className="hd-icon-btn hd-icon-btn--sm"
          onClick={() => { setSelected(null); setYear((y) => y + 1); }}
          aria-label="Next year"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* ==================== Year grid ==================== */}
      <div className="hd-cal__year-grid">
        {months.map((month) => (
          <div key={month.label} className="hd-cal__month-block">
            <div className="hd-cal__month-label">{month.label}</div>

            <div className="hd-cal__mini-grid" role="grid" aria-label={`${month.label} ${year}`}>
              {month.cells.map((c, i) =>
                c === null ? (
                  <div key={`e${i}`} className="hd-cal__mini-cell hd-cal__mini-cell--empty" aria-hidden="true" />
                ) : (
                  <button
                    key={c.iso}
                    role="gridcell"
                    className={[
                      'hd-cal__mini-cell',
                      c.status && STATUS_CLASS[c.status] ? `hd-cal__mini-cell--${STATUS_CLASS[c.status]}` : '',
                      c.isToday ? 'hd-cal__mini-cell--today' : '',
                    ].filter(Boolean).join(' ')}
                    aria-label={`${c.iso}: ${STATUS_LABEL[c.status] ?? 'No entry'}`}
                    onClick={() => setSelected(c)}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ==================== Selected date ==================== */}
      {selected && (
        <div className="hd-cal__selected" aria-live="polite">
          <strong>{selected.iso}</strong>{' — '}{STATUS_LABEL[selected.status] ?? 'No entry'}
        </div>
      )}

      {/* ==================== Legend ==================== */}
      <div className="hd-cal__legend">
        <span className="hd-cal__legend-item"><span className="hd-cal__swatch hd-cal__swatch--done" />Completed</span>
        <span className="hd-cal__legend-item"><span className="hd-cal__swatch hd-cal__swatch--partial" />Partial</span>
        <span className="hd-cal__legend-item"><span className="hd-cal__swatch hd-cal__swatch--missed" />Missed / Skipped</span>
        <span className="hd-cal__legend-item"><span className="hd-cal__swatch" />No entry</span>
      </div>
    </div>
  );
}

/* ==========================================================================
 * 2. HistoryChart
 * ========================================================================== */


export function HistoryChart({ data = [] }) {
  const [timeframe, setTimeframe] = useState('week');

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const hasTimeframe = data.some((item) => item?.timeframe != null);
    if (hasTimeframe) return data.filter((item) => item.timeframe === timeframe);
    return data;
  }, [data, timeframe]);

  const chartData =
    filteredData.length > 0
      ? filteredData
      : [
          { label: 'Mon', value: 80 },
          { label: 'Tue', value: 60 },
          { label: 'Wed', value: 100 },
          { label: 'Thu', value: 40 },
          { label: 'Fri', value: 90 },
          { label: 'Sat', value: 70 },
          { label: 'Sun', value: 85 },
        ];

  const maxVal = Math.max(...chartData.map((d) => Number(d.value) || 0), 100);
  const avg = Math.round(
    chartData.reduce((s, d) => s + (Number(d.value) || 0), 0) / chartData.length
  );

  const chartHeight = 90;
  const chartWidth = 300;
  const gap = 4;
  const barWidth =
    chartData.length > 0
      ? (chartWidth - gap * (chartData.length - 1)) / chartData.length
      : 20;

  return (
    <div className="history-chart-card">
      <div className="history-chart-header">
        <div className="history-chart-header__text">
          <h3>Completion history</h3>
          <span className="history-chart-avg">{avg}% avg</span>
        </div>

        <div className="timeframe-selector">
          {['week', 'month', 'year'].map((tf) => (
            <button
              key={tf}
              className={timeframe === tf ? 'active' : ''}
              onClick={() => setTimeframe(tf)}
            >
              {tf === 'week' ? 'W' : tf === 'month' ? 'M' : 'Y'}
            </button>
          ))}
        </div>
      </div>

      <div className="svg-container">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          width="100%"
          height="100%"
          role="img"
          aria-label="Completion history chart"
        >
          <line
            x1="0"
            y1={chartHeight - 16}
            x2={chartWidth}
            y2={chartHeight - 16}
            className="hd-grid-line"
          />

          {chartData.map((item, index) => {
            const value = Number(item.value) || 0;
            const barHeight = Math.max((value / maxVal) * (chartHeight - 26), 2);
            const x = index * (barWidth + gap);
            const y = chartHeight - barHeight - 16;
            const isTop = value >= avg;

            return (
              <g key={item.id ?? item.label ?? index} className="bar-group">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={10}
                  className={`chart-bar${isTop ? ' chart-bar--top' : ''}`}
                >
                  <title>{`${item.label} — ${value}%`}</title>
                </rect>

                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 4}
                  textAnchor="middle"
                  className="chart-label"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ==========================================================================
 * 3. LineChart
 * ========================================================================== */

/**
 * Dependency-free SVG line chart with touch-friendly tooltips.
 * Props: { points: [{label, value}], yMax?: number, height?: number }
 */
export function LineChart({ points, yMax = 100, height = 220 }) {
  const tooltipId = useId();
  const wrapRef = useRef(null);
  const [active, setActive] = useState(null);

  const W = 640;
  const PAD = { top: 16, right: 16, bottom: 30, left: 42 };

  const { coords, yTicks } = useMemo(() => {
    const innerW = W - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
    const coords = points.map((p, i) => ({
      ...p,
      x: PAD.left + i * step,
      y: PAD.top + innerH * (1 - Math.min(p.value, yMax) / yMax),
    }));
    const yTicks = [0.2, 0.4, 0.6, 0.8, 1].map((f) => ({
      value: Math.round(yMax * f),
      y: PAD.top + innerH * (1 - f),
    }));
    return { coords, yTicks };
  }, [points, yMax, height]);

  function showTooltip(i) {
    setActive(i);
    const wrap = wrapRef.current;
    const tip = wrap?.querySelector(`[data-tip="${tooltipId}"]`);
    if (!wrap || !tip || i == null) return;
    const { x, y, label, value } = coords[i];
    tip.textContent = `${label} — ${value}%`;
    tip.style.left = `${(x / W) * 100}%`;
    tip.style.top = `${y}px`;
    tip.classList.add('hd-chart__tooltip--visible');
  }

  function hideTooltip() {
    setActive(null);
    wrapRef.current
      ?.querySelector(`[data-tip="${tooltipId}"]`)
      ?.classList.remove('hd-chart__tooltip--visible');
  }

  if (!points.length) return null;

  const path = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x},${c.y}`).join(' ');

  return (
    <div className="hd-chart-wrap" ref={wrapRef}>
      <svg
        className="hd-chart hd-chart-scroll"
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label="Progress over time chart"
      >
        {yTicks.map((t) => (
          <g key={t.value}>
            <line
              className="hd-grid-line"
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
            />
            <text className="hd-y-label" x={PAD.left - 8} y={t.y + 4}>
              {t.value}%
            </text>
          </g>
        ))}
        <path className="hd-line-path" d={path} />
        {coords.map((c, i) => (
          <circle
            key={c.label}
            className={`hd-line-dot${active === i ? ' hd-line-dot--active' : ''}`}
            cx={c.x}
            cy={c.y}
            r={active === i ? 6 : 4}
            tabIndex={0}
            onMouseEnter={() => showTooltip(i)}
            onMouseLeave={hideTooltip}
            onFocus={() => showTooltip(i)}
            onBlur={hideTooltip}
            onTouchStart={() => showTooltip(i)}
          >
            <title>{`${c.label} — ${c.value}%`}</title>
          </circle>
        ))}
        {coords.map((c) => (
          <text key={`x-${c.label}`} className="hd-axis-label" x={c.x} y={height - 8}>
            {c.label}
          </text>
        ))}
      </svg>
      <div className="hd-chart__tooltip" data-tip={tooltipId} />
    </div>
  );
}

/* ==========================================================================
 * 4. AnalyticsDashboard
 * ========================================================================== */

const PERIODS = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

function SectionState({ loading, error, onRetry, children }) {
  if (loading) {
    return <div className="skeleton" style={{ minHeight: 140 }} aria-label="Loading chart" />;
  }

  if (error) {
    return (
      <div className="state state--error">
        <p className="state__title">Couldn’t load this section</p>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  return children;
}

export default function AnalyticsDashboard({ habitId }) {
  const [period, setPeriod] = useState('month');

  const [progress, setProgress] = useState({
    data: null,
    loading: true,
    error: null,
  });

  const [history, setHistory] = useState({
    data: null,
    loading: true,
    error: null,
  });

  const [logs, setLogs] = useState({
    data: null,
    loading: true,
    error: null,
  });

  async function loadProgress() {
    setProgress((s) => ({ ...s, loading: true, error: null }));

    try {
      const raw = await getHabitLogs(habitId);
      const points = logsToProgressPoints(raw);

      setProgress({
        data: { points, yMax: 100 },
        loading: false,
        error: null,
      });
    } catch (e) {
      setProgress({
        data: null,
        loading: false,
        error: e.message || 'Failed to load progress.',
      });
    }
  }

  async function loadHistory() {
    setHistory((s) => ({ ...s, loading: true, error: null }));

    try {
      const raw = await getHabitLogs(habitId);
      const filtered = filterLogsByPeriod(raw, period);
      const buckets = logsToHistoryBuckets(filtered);

      setHistory({
        data: { buckets },
        loading: false,
        error: null,
      });
    } catch (e) {
      setHistory({
        data: null,
        loading: false,
        error: e.message || 'Failed to load history.',
      });
    }
  }

  async function loadLogs() {
    setLogs((s) => ({ ...s, loading: true, error: null }));

    try {
      const data = await getHabitLogs(habitId);

      setLogs({
        data,
        loading: false,
        error: null,
      });
    } catch (e) {
      setLogs({
        data: null,
        loading: false,
        error: e.message || 'Failed to load calendar.',
      });
    }
  }

  useEffect(() => {
    loadProgress();
    loadLogs();
  }, [habitId]);

  useEffect(() => {
    loadHistory();
  }, [habitId, period]);

  // Convert API logs into the Map expected by CalendarHeatmap
  const statusMap = useMemo(() => {
    return logsToStatusMap(logs.data ?? []);
  }, [logs.data]);

  const now = new Date();

  return (
    <>
      {/* ==================== Progress ==================== */}
      <section className="hd-section" aria-labelledby="hd-progress-title">
        <div className="hd-section__header">
          <h2 className="hd-section__title" id="hd-progress-title">
            Progress
          </h2>
        </div>

        <SectionState
          loading={progress.loading}
          error={progress.error}
          onRetry={loadProgress}
        >
          {progress.data?.points?.length ? (
            <LineChart
              points={progress.data.points}
              yMax={progress.data.yMax ?? 100}
              height={140}
            />
          ) : (
            <div className="state" style={{ minHeight: 140, padding: '28px 18px' }}>
              <p className="state__title">No progress data yet</p>
              <p>Log a few days and the line will appear.</p>
            </div>
          )}
        </SectionState>
      </section>

      {/* ==================== History ==================== */}
      <section className="hd-section" aria-labelledby="hd-history-title">
        <div className="hd-section__header">
          <h2 className="hd-section__title" id="hd-history-title">
            History
          </h2>

          <label
            htmlFor="hd-period"
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
            }}
          >
            Time period
          </label>

          <select
            id="hd-period"
            className="hd-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <SectionState
          loading={history.loading}
          error={history.error}
          onRetry={loadHistory}
        >
          {history.data?.buckets?.length ? (
            <HistoryChart data={history.data.buckets} />
          ) : (
            <div className="state" style={{ minHeight: 140, padding: '28px 18px' }}>
              <p className="state__title">No history data yet</p>
              <p>Entries from this period will show up here.</p>
            </div>
          )}
        </SectionState>
      </section>

      {/* ==================== Calendar ==================== */}
      <section className="hd-section" aria-labelledby="hd-calendar-title">
        <div className="hd-section__header">
          <h2 className="hd-section__title" id="hd-calendar-title">
            Calendar
          </h2>
        </div>

        <SectionState loading={logs.loading} error={logs.error} onRetry={loadLogs}>
          <CalendarHeatmap
            statusMap={statusMap}
            initialYear={now.getFullYear()}
          />
        </SectionState>
      </section>
    </>
  );
}