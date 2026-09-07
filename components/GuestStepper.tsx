"use client";
export function GuestStepper({
  value,
  onChange,
  max = 10,
  label = "כמה אתן?",
  hint,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  label?: string;
  hint?: string;
}) {
  return (
    <div className="guests-field">
      <span id="guests-label">{label}</span>
      <div className="stepper" role="group" aria-labelledby="guests-label">
        <button
          type="button"
          aria-label="פחות"
          disabled={value <= 1}
          onClick={() => onChange(Math.max(1, value - 1))}
        >
          −
        </button>
        <output aria-live="polite">
          <span key={value} className="guest-count">
            {value}
          </span>
        </output>
        <button
          type="button"
          aria-label="יותר"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
      {hint && <small>{hint}</small>}
    </div>
  );
}
