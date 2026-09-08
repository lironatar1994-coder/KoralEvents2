"use client";
import { useEffect } from "react";
/*
 * Past the first screen the header becomes a glass bar that slides in when
 * scrolling up and tucks away when scrolling down, so the way back to the
 * evenings is always one flick away without stealing space while reading.
 */
export function HeaderScroll() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".k-header");
    if (!header) return;
    let last = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const stuck = y > 240;
      header.classList.toggle("is-stuck", stuck);
      if (!stuck) header.classList.remove("is-shown");
      else if (y < last) header.classList.add("is-shown");
      else if (y > last + 1) header.classList.remove("is-shown");
      last = y;
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return null;
}
