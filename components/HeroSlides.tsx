"use client";
import { appPath } from "@/lib/paths";
import { useEffect, useState } from "react";
// Brand scenes for the first screen. The first one is rendered on the server
// and is the only image fetched before first paint; the rest load afterwards.
const slides = [
  "production-kotel",
  "production-torah",
  "production-challah",
  "production-empowerment",
];
const INTERVAL = 6500;
const FADE = 1400;
export function HeroSlides() {
  const [{ active, prev }, setIdx] = useState({ active: 0, prev: -1 });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const warm = setTimeout(() => {
      const kind = window.matchMedia("(min-width: 700px)").matches
        ? "landscape"
        : "portrait";
      for (const s of slides.slice(1)) {
        const img = new Image();
        img.src = appPath(`/brand/hero-${s}-${kind}.webp`);
      }
      setReady(true);
    }, 1200);
    return () => clearTimeout(warm);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(
      () =>
        setIdx((s) => ({
          active: (s.active + 1) % slides.length,
          prev: s.active,
        })),
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
            className={`hero-slide ${i === active ? "is-active" : i === prev ? "is-prev" : ""}`}
            style={{ "--fade": `${FADE}ms` } as React.CSSProperties}
            aria-hidden={i !== active}
          >
            <source
              media="(min-width: 700px)"
              srcSet={appPath(`/brand/hero-${s}-landscape.webp`)}
            />
            <img
              src={appPath(`/brand/hero-${s}-portrait.webp`)}
              alt=""
              fetchPriority={i === 0 ? "high" : "auto"}
            />
          </picture>
        ) : null,
      )}
    </>
  );
}
