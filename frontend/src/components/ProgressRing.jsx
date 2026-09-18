// src/components/ProgressRing.jsx
// The signature Momentum element: a calm circular progress indicator with a
// subtle animated draw-on mount and an optional count-up value in the middle.

import { useEffect, useState } from 'react';
import { useCountUp } from '../hooks/useCountUp';

const TWO_PI = 2 * Math.PI;

/**
 * @param {object}   props
 * @param {number}   props.value        0-100 fill amount.
 * @param {number}   [props.size=120]   Pixel diameter.
 * @param {number}   [props.stroke=10]  Track / progress stroke width.
 * @param {string}   [props.color]      Stroke color (defaults to accent token).
 * @param {boolean}  [props.animate]    Animate the draw on mount (default true).
 * @param {number}   [props.delay]      ms delay before the draw starts.
 * @param {React.ReactNode} [props.children] Center content (overrides value label).
 * @param {string}   [props.label]      Small caption under the value.
 * @param {string}   [props.className]
 */
export default function ProgressRing({
  value = 0,
  size = 120,
  stroke = 10,
  color,
  animate = true,
  delay = 120,
  children,
  label,
  className = '',
}) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - stroke) / 2;
  const circumference = TWO_PI * radius;
  const [drawn, setDrawn] = useState(!animate);
  const count = useCountUp(clamped, 1000);

  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => setDrawn(true), delay);
    return () => clearTimeout(timer);
  }, [animate, delay]);

  const offset = drawn ? circumference * (1 - clamped / 100) : circumference;
  const font = clamp(size / 3.4, 0.95, 2.4);

  return (
    <div
      className={`ring ${className}`}
      style={{
        width: size,
        height: size,
        '--ring-font': `${font}rem`,
        '--ring-color': color || 'var(--mt-accent)',
      }}
      role="img"
      aria-label={label ? `${label}: ${Math.round(clamped)}%` : `${Math.round(clamped)}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className="ring__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      {children ? (
        <div className="ring__center">{children}</div>
      ) : (
        <div className="ring__center">
          <span className="ring__value">{Math.round(count)}</span>
          {label && <span className="ring__label">{label}</span>}
        </div>
      )}
    </div>
  );
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
