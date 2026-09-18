// src/hooks/useCountUp.js
// Counts a number up to its target on mount — a small, calm nod to the
// "progress in motion" vibe. Respects prefers-reduced-motion.

import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useCountUp(target, duration = 900) {
  const numericTarget = Number(target) || 0;

  // Start from zero so the value eases up on mount (unless reduced motion
  // is requested, in which case the target is shown immediately).
  const [value, setValue] = useState(() =>
    prefersReducedMotion() ? numericTarget : 0
  );
  const targetRef = useRef(numericTarget);

  useEffect(() => {
    targetRef.current = numericTarget;

    if (prefersReducedMotion()) return;

    let frame;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo — fast at first, settling gently at the end.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(targetRef.current * eased);

      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [numericTarget, duration]);

  return value;
}
