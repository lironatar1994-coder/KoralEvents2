import { appPath } from "@/lib/paths";

export function HeroSlides() {
  return (
    <div className="k-hero-media" aria-hidden="true">
      <picture className="hero-signature">
        <img
          src={appPath("/brand/hero-signature-landscape.webp")}
          alt=""
          width={1536}
          height={1024}
          fetchPriority="high"
        />
      </picture>
    </div>
  );
}
