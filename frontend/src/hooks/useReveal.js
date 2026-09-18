// src/hooks/useReveal.js
// Subtle scroll-reveal motion. Adds `is-visible` once the element enters
// the viewport, so CSS transitions handle the actual animation.

import { useEffect, useRef, useState } from 'react';

export function useReveal(options = {}) {
  const { threshold = 0.12, once = true, rootMargin = '0px 0px -40px 0px' } = options;
  const ref = useRef(null);
  // When IntersectionObserver is unavailable the element is simply visible.
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return [ref, visible];
}

/**
 * Staggered reveal for a list of children. Returns a ref for the container
 * and the visible flag; children should use style={{ transitionDelay }}.
 */
export function useRevealList(count = 0, step = 55) {
  const [ref, visible] = useReveal();
  const delays = Array.from({ length: count }, (_, i) => `${i * step}ms`);
  return [ref, visible, delays];
}
