"use client";
import { useEffect, useState } from "react";
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
  return (
    <>
      <div id="registration" className="registration-box">
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
            <span className="eyebrow">GOOD THINGS ARE ON THEIR WAY</span>
          </div>
        ) : (
          <form method="post" onSubmit={submit}>
            <h3>
              {full ? "מלא כאן, אבל אולי יתפנה מקום." : "שומרות לך רגע טוב."}
            </h3>
            <p>
              {full
                ? "השאירי פרטים לבקשת הצטרפות לרשימת ההמתנה."
                : "השאירי שם וטלפון, ואנחנו נדאג להמשך."}
            </p>
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
            <p className="field-hint">
              הפרטים ישמשו לניהול ההרשמה וליצירת קשר בנוגע לאירוע בלבד, ויהיו
              זמינים למנהלת.
            </p>
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
              {busy
                ? "שולחת את הבקשה…"
                : full
                  ? "בקשת הצטרפות להמתנה"
                  : "שליחת בקשת הרשמה"}
            </button>
            <p className="registration-note">
              לנשים בלבד · בכפוף לאישור המנהלת · מקום אחד לכל הרשמה
            </p>
          </form>
        )}
      </div>
      {!success && (
        <div className="mobile-register-bar">
          <span>
            {full ? "נתראה אם יתפנה מקום" : "מפגש אחד. זיכרון שנשאר."}
          </span>
          <a className="button gold-button" href="#registration">
            {full ? "לרשימת ההמתנה" : "בקשת הרשמה"}
            <ArrowUpLeft size={17} />
          </a>
        </div>
      )}
    </>
  );
}
