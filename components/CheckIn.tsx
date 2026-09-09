"use client";
import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock3,
  Loader2,
  Phone,
  Users,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/client";
import {
  Registration,
  Ticket,
  dateLabel,
  timeLabel,
  ticketStateLabels,
} from "@/lib/types";
import { ticketCode, ticketState } from "@/lib/tickets";
/* One glance, one tap: is she on the list, and let her in. */
export function CheckIn({ initial }: { initial: Ticket }) {
  const [ticket, setTicket] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [justIn, setJustIn] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const { event: e, registration: r, state } = ticket;
  async function mark(checked: boolean) {
    setBusy(true);
    setError("");
    try {
      const result = await api<{
        already: boolean;
        registration: Registration;
      }>("/api/admin/checkin", "POST", {
        token: r.ticket_token,
        checked_in: checked,
      });
      setTicket({
        ...ticket,
        registration: result.registration,
        state: ticketState(e, result.registration),
      });
      setJustIn(checked && !result.already);
      setDuplicate(checked && result.already);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const tone =
    state === "valid"
      ? "ok"
      : state === "checked-in"
        ? justIn
          ? "ok"
          : "warn"
        : "bad";
  return (
    <section
      className={`checkin-card tone-${tone} ${justIn ? "is-fresh" : ""}`}
      aria-live="polite"
    >
      <span className="checkin-mark" aria-hidden="true">
        {state === "valid" ? (
          <Check size={40} strokeWidth={3} />
        ) : state === "checked-in" ? (
          justIn ? (
            <Check size={40} strokeWidth={3} />
          ) : (
            <Clock3 size={36} />
          )
        ) : state === "cancelled" ? (
          <XCircle size={38} />
        ) : (
          <AlertTriangle size={36} />
        )}
      </span>
      <h1>
        {state === "checked-in"
          ? justIn
            ? "נכנסה. ברוכה הבאה!"
            : "שימי לב: כבר נכנסה"
          : ticketStateLabels[state]}
      </h1>
      {state === "checked-in" && (
        <p className="checkin-sub">
          סומנה בכניסה ב-{timeLabel(r.checked_in_at!)} ·{" "}
          {dateLabel(r.checked_in_at!)}
          {duplicate && " · זו סריקה שנייה של אותו כרטיס."}
        </p>
      )}
      {state === "valid" && (
        <p className="checkin-sub">הכרטיס אמיתי ומופיע ברשימת המאושרות.</p>
      )}
      {state === "not-approved" && (
        <p className="checkin-sub">
          היא רשומה, אבל עוד לא אושרה. אפשר לאשר אותה ברשימת המשתתפות ואז
          להכניס.
        </p>
      )}
      {state === "qr-off" && (
        <p className="checkin-sub">
          אפשר להדליק ״כניסה עם QR״ בעריכה המהירה של האירוע.
        </p>
      )}
      <div className="checkin-guest">
        <strong>{r.name}</strong>
        <span className="checkin-guest-meta">
          {r.guests > 1 && (
            <span>
              <Users size={14} /> היא ועוד {r.guests - 1} · {r.guests} מקומות
            </span>
          )}
          <a href={`tel:${r.phone}`} dir="ltr">
            <Phone size={14} /> {r.phone}
          </a>
          <span className="ticket-code" dir="ltr">
            {ticketCode(r.ticket_token)}
          </span>
        </span>
      </div>
      <p className="checkin-event">
        {e.title} · {dateLabel(e.starts_at, { weekday: "long" })} ·{" "}
        {timeLabel(e.starts_at)}
      </p>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {state === "valid" && (
        <button
          className="k-btn k-btn-rose checkin-button"
          disabled={busy}
          onClick={() => mark(true)}
        >
          {busy ? <Loader2 className="spin" size={20} /> : <Check size={20} />}
          {r.guests > 1 ? `אישור כניסה · ${r.guests} מקומות` : "אישור כניסה"}
        </button>
      )}
      {state === "checked-in" && (
        <button
          className="k-link checkin-undo"
          disabled={busy}
          onClick={() => mark(false)}
        >
          {duplicate || !justIn ? "זו טעות? ביטול הסימון" : "ביטול הסימון"}
        </button>
      )}
      {state === "not-approved" && (
        <Link
          className="k-btn k-btn-rose checkin-button"
          href={`/admin/events/${e.id}?status=pending`}
        >
          לאישור ברשימת המשתתפות
        </Link>
      )}
    </section>
  );
}
