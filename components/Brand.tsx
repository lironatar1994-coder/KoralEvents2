import Link from "next/link";
export function Spark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5C13 8 16 11 22.5 12C16 13 13 16 12 22.5C11 16 8 13 1.5 12C8 11 11 8 12 1.5Z" />
    </svg>
  );
}
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${small ? "brand-small" : ""}`}
      aria-label="Koral Events — לעמוד הבית"
    >
      <span className="brand-word">
        Koral
        <Spark className="brand-spark" />
      </span>
      <span className="brand-sub">Events</span>
    </Link>
  );
}
