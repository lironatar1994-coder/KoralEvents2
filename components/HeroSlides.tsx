"use client";
import { useEffect, useState } from "react";
// Brand scenes for the first screen. The first one is rendered on the server
// and is the only image fetched before first paint; the rest load afterwards.
const slides = ["rooftop", "alley", "beach"];
const INTERVAL = 4000;
export function HeroSlides() {
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const warm = setTimeout(() => {
      for (const s of slides.slice(1))
        for (const kind of ["portrait", "landscape"]) {
          const img = new Image();
          img.src = `/brand/hero-${s}-${kind}.webp`;
        }
      setReady(true);
    }, 1200);
    return () => clearTimeout(warm);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(
      () => setActive((a) => (a + 1) % slides.length),
      INTERVAL,
    );
    return () => clearInterval(id);
  }, [ready]);
  return (
    <>
      {slides.map((s, i) =>
        i === 0 || ready ? (
          <picture
            key={s}
            className={`hero-slide ${i === active ? "is-active" : ""}`}
            aria-hidden={i !== active}
          >
            <source
              media="(min-width: 700px)"
              srcSet={`/brand/hero-${s}-landscape.webp`}
            />
            <img
              src={`/brand/hero-${s}-portrait.webp`}
              alt=""
              fetchPriority={i === 0 ? "high" : "auto"}
            />
          </picture>
        ) : null,
      )}
    </>
  );
}
