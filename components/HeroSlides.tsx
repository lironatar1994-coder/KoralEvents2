import { appPath } from "@/lib/paths";

export function HeroSlides() {
  return (
    <div className="k-hero-media" aria-hidden="true">
      <picture className="hero-signature">
        <source
          media="(min-width: 700px)"
          srcSet={appPath("/brand/hero-signature-landscape.webp")}
          width={1536}
          height={1024}
        />
        <img
          src={appPath("/brand/hero-signature-portrait.webp")}
          alt=""
          width={1024}
          height={1536}
          fetchPriority="high"
        />
      </picture>
    </div>
  );
}
