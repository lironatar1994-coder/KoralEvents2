import Link from "next/link";
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${small ? "brand-small" : ""}`}
      aria-label="Koral Events — לעמוד הבית"
    >
      <span>
        KORAL<span className="brand-dot">.</span>
      </span>
      <span className="brand-sub">E V E N T S</span>
    </Link>
  );
}
