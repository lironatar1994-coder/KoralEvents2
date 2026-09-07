"use client";
import { useEffect } from "react";
/*
 * Reveals every `[data-reveal]` element as it scrolls into view.
 * Elements already on screen when the page hydrates are left alone, so there
 * is never a flash; only what is still below the fold waits for its turn.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (!els.length) return;
    let first = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (first && !entry.isIntersecting) {
            if (entry.boundingClientRect.top > innerHeight)
              el.classList.add("reveal-wait");
            else io.unobserve(el);
            continue;
          }
          if (entry.isIntersecting) {
            el.classList.add("reveal-in");
            io.unobserve(el);
          }
        }
        first = false;
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
