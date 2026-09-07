import { Clock3 } from "lucide-react";

export function SuccessCheck({ waitlist = false }: { waitlist?: boolean }) {
  return (
    <span
      className={`success-icon${waitlist ? " is-waitlist" : ""}`}
      aria-hidden="true"
    >
      {waitlist ? (
        <Clock3 />
      ) : (
        <svg viewBox="0 0 52 52" className="success-mark">
          <circle className="success-ring" cx="26" cy="26" r="24" />
          <path className="success-check" d="M15 27.5l7.5 7.5L37 18" />
        </svg>
      )}
    </span>
  );
}
