"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpLeft, Check, Heart, Loader2 } from "lucide-react";
export function RegistrationForm({
  eventId,
  open,
  full,
}: {
  eventId: string;
  open: boolean;
  full: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [formOnScreen, setFormOnScreen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => setFormOnScreen(entry.isIntersecting),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [open]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setSuccess(data.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "לא הצלחנו לשלוח. נסי שוב.");
    } finally {
      setBusy(false);
    }
  }
  if (!open)
    return (
      <div className="registration-closed">
        <Heart size={22} />
        <h3>ההרשמה לאירוע הזה הסתיימה</h3>
        <p>נשמח להיפגש באחד האירועים הבאים.</p>
      </div>
    );
  const cta = full ? "בקשת הצטרפות להמתנה" : "שליחת בקשת הרשמה";
  return (
    <>
      <div id="registration" className="registration-box" ref={box}>
        {success ? (
          <div className="registration-success" role="status">
            <span className="success-icon">
              <Check />
            </span>
            <h3>
              {success === "waitlist"
                ? "קיבלנו את בקשת ההמתנה שלך"
                : "הבקשה שלך התקבלה"}
            </h3>
            <p>
              {success === "waitlist"
                ? "האירוע מלא כרגע. אם יתפנה מקום והמנהלת תאשר, היא תיצור איתך קשר."
                : "המקום עדיין לא מאושר. המנהלת תבדוק את הבקשה ותיצור איתך קשר לאחר האישור."}
            </p>
          </div>
        ) : (
          <form method="post" onSubmit={submit}>
            {full && (
              <p className="registration-full">
                מלא כאן, אבל אולי יתפנה מקום. השאירי פרטים לרשימת ההמתנה.
              </p>
            )}
            <label>
              השם המלא שלך
              <input
                name="name"
                autoComplete="name"
                placeholder="איך קוראים לך?"
                minLength={2}
                maxLength={100}
                required
              />
            </label>
            <label>
              מספר הטלפון
              <input
                name="phone"
                type="tel"
                dir="ltr"
                autoComplete="tel"
                placeholder="050-000-0000"
                maxLength={20}
                required
              />
            </label>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <button
              className="button gold-button full-width"
              disabled={!ready || busy}
            >
              {busy ? (
                <Loader2 className="spin" size={18} />
              ) : (
                <ArrowUpLeft size={19} />
              )}{" "}
              {busy ? "שולחת את הבקשה…" : cta}
            </button>
            <p className="registration-note">
              לנשים בלבד · בכפוף לאישור המנהלת · הפרטים משמשים לאירוע הזה בלבד
            </p>
          </form>
        )}
      </div>
      {!success && (
        <div
          className={`mobile-register-bar ${formOnScreen ? "is-hidden" : ""}`}
        >
          <a className="button gold-button" href="#registration">
            {full ? "לרשימת ההמתנה" : "אני באה"}
            <ArrowUpLeft size={19} />
          </a>
        </div>
      )}
    </>
  );
}
