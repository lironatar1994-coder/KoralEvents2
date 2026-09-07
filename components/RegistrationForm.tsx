"use client";
import { appPath } from "@/lib/paths";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpLeft,
  CalendarPlus,
  Check,
  Heart,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Spark } from "./Brand";
import { GuestStepper } from "./GuestStepper";
import { KoralEvent, dateLabel, timeLabel } from "@/lib/types";
function calendarStamp(iso: string, plusHours = 0) {
  const d = new Date(new Date(iso).getTime() + plusHours * 3600_000);
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}
export function RegistrationForm({
  event,
  open,
  full,
}: {
  event: KoralEvent;
  open: boolean;
  full: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ready, setReady] = useState(false);
  const [guests, setGuests] = useState(1);
  useEffect(() => setReady(true), []);
  const [formOnScreen, setFormOnScreen] = useState(false);
  const [apple, setApple] = useState(false);
  useEffect(() => {
    setApple(/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent));
  }, []);
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
      const r = await fetch(appPath(`/api/events/${event.id}/register`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          guests,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setSuccess(data.status);
      box.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "לא הצלחנו לשלוח. בדקי את החיבור ונסי שוב.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!open)
    return (
      <div className="registration-closed">
        <Heart size={22} />
        <h3>ההרשמה לערב הזה נסגרה.</h3>
        <p>הערב הבא כבר מחכה לנו למטה.</p>
      </div>
    );
  const when = `${dateLabel(event.starts_at, { weekday: "long" })} · ${timeLabel(event.starts_at)}`;
  const calendarUrl = apple
    ? appPath(`/api/events/${event.id}/calendar.ics`)
    : "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(event.title)}` +
      `&dates=${calendarStamp(event.starts_at)}/${calendarStamp(event.starts_at, 3)}` +
      `&location=${encodeURIComponent(event.address || event.location)}` +
      `&details=${encodeURIComponent("Koral Events · לנשים בלבד")}`;
  function shareUrl() {
    const link =
      typeof window === "undefined" ? "" : window.location.href.split("#")[0];
    return `https://wa.me/?text=${encodeURIComponent(
      `היי! נרשמתי ל״${event.title}״ ב-${when}. בואי איתי? ${link}`,
    )}`;
  }
  const cta = full
    ? "שמרי לי מקום בהמתנה"
    : guests > 1
      ? "אנחנו באות"
      : "אני באה";
  return (
    <>
      <div id="registration" className="registration-box" ref={box}>
        {success ? (
          <div className="registration-success" role="status">
            <span className="success-icon">
              <Check />
            </span>
            <h3>
              {success === "waitlist" ? (
                <>את ברשימת ההמתנה.</>
              ) : (
                <>
                  נתראה ב{dateLabel(event.starts_at, { weekday: "long" })}
                  <Spark className="success-spark" />
                </>
              )}
            </h3>
            <p>
              {success === "waitlist"
                ? "הערב מלא כרגע. אם יתפנה מקום, המנהלת תיצור איתך קשר."
                : "המקום עדיין לא מאושר. המנהלת תעבור על הבקשה ותחזור אלייך בהודעה או בטלפון."}
            </p>
            <div className="success-actions">
              {success !== "waitlist" && (
                <a
                  className="button outline-button"
                  href={calendarUrl}
                  target={apple ? undefined : "_blank"}
                  rel="noreferrer"
                >
                  <CalendarPlus size={18} /> הוסיפי ליומן
                </a>
              )}
              <a
                className="button gold-button"
                href={shareUrl()}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} /> תביאי חברה
              </a>
            </div>
          </div>
        ) : (
          <form method="post" onSubmit={submit}>
            {full && (
              <p className="registration-full">
                הערב מלא. השאירי פרטים, ואם יתפנה מקום נודיע לך.
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
            <GuestStepper
              value={guests}
              onChange={setGuests}
              max={6}
              hint={guests === 1 ? "רק אני" : `אני ועוד ${guests - 1}, על השם שלי`}
            />
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <button
              className="button gold-button full-width"
              disabled={!ready || busy}
            >
              {busy ? "שולחת…" : cta}
              {busy ? (
                <Loader2 className="spin" size={18} />
              ) : (
                <ArrowUpLeft size={20} />
              )}
            </button>
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
