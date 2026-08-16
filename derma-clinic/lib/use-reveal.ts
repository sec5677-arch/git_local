"use client";

import { useEffect, useRef } from "react";

/**
 * `useReveal` — IntersectionObserver-based scroll reveal.
 *
 * Adds the `is-visible` class to the `.reveal` element when it enters the
 * viewport, triggering the CSS fade-up transition. Idempotent: once visible,
 * the observer disconnects so scrolling back up never re-hides content.
 *
 * Accessibility:
 *  - Respects `prefers-reduced-motion` via the global CSS override in
 *    globals.css (transitions collapse to ~0ms), so the element still
 *    becomes visible — just without motion.
 *
 * @returns ref to attach to the reveal target element
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // SSR / no-IO support: reveal immediately, fall back to visible.
    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}
