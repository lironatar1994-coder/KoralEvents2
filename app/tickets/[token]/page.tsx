import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpLeft,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  ScanLine,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { getTicket } from "@/lib/events";
import { dateLabel, timeLabel } from "@/lib/types";
import { checkinUrl, ticketCode, ticketReady } from "@/lib/tickets";
import { Brand } from "@/components/Brand";
import { EventImage } from "@/components/Public";
import { QrCode } from "@/components/QrCode";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const ticket = await getTicket((await params).token);
  return {
    title: ticket ? `הכרטיס שלך · ${ticket.event.title}` : "הכרטיס לא נמצא",
    robots: { index: false, follow: false },
  };
}
const waiting: Record<string, { title: string; text: string }> = {
  "not-approved": {
    title: "הכרטיס בדרך.",
    text: "ברגע שהמנהלת תאשר את ההרשמה, קוד ה-QR יופיע כאן. שמרי את הקישור הזה.",
  },
  cancelled: {
    title: "ההרשמה הזו בוטלה.",
    text: "אם זו טעות, כתבי למנהלת והיא תסדר את זה.",
  },
  "qr-off": {
    title: "לערב הזה לא צריך QR.",
    text: "מגיעות עם השם, וזהו. נתראה שם.",
  },
};
export default async function TicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const ticket = await getTicket((await params).token);
  if (!ticket) notFound();
  const { event: e, registration: r, state } = ticket;
  const ready = ticketReady(ticket);
  const inside = state === "checked-in";
  return (
    <div className="public-site ticket-page">
      <div className="ticket-sky" aria-hidden="true" />
      <main id="main" className="ticket-main">
        <Brand small />
        <p className="ticket-kicker">
          <Sparkles size={14} />
          {inside ? "ברוכה הבאה" : ready ? "כרטיס הכניסה שלך" : "הכרטיס שלך"}
        </p>
        <article className={`ticket ${inside ? "is-inside" : ""}`}>
          <div className="ticket-head">
            <EventImage event={e} priority />
            <div className="ticket-head-shade" aria-hidden="true" />
            <div className="ticket-head-text">
              <span className="k-tag">{e.category}</span>
              <h1>{e.title}</h1>
              <p className="ticket-when">
                <span>
                  <CalendarDays size={15} />
                  {dateLabel(e.starts_at, { weekday: "long" })}
                </span>
                <span>
                  <Clock3 size={15} />
                  {timeLabel(e.starts_at)}
                </span>
              </p>
            </div>
          </div>
          <div className="ticket-notch" aria-hidden="true" />
          <div className="ticket-body">
            <div className="ticket-guest">
              <small>{r.guests > 1 ? "על השם של" : "אורחת"}</small>
              <strong>{r.name}</strong>
              {r.guests > 1 && (
                <span className="ticket-guests">
                  <Users size={14} />
                  היא ועוד {r.guests - 1} · {r.guests} מקומות
                </span>
              )}
            </div>
            {ready ? (
              <div className="ticket-qr">
                <div className="ticket-qr-frame">
                  <QrCode
                    value={checkinUrl(r.ticket_token)}
                    className="ticket-qr-code"
                    label={`קוד QR לכניסה של ${r.name}`}
                  />
                  {inside && (
                    <div className="ticket-inside" role="status">
                      <span className="ticket-inside-mark">
                        <Check size={30} strokeWidth={3} />
                      </span>
                      <strong>נכנסת</strong>
                      <small>
                        {timeLabel(r.checked_in_at!)} ·{" "}
                        {dateLabel(r.checked_in_at!)}
                      </small>
                    </div>
                  )}
                </div>
                <span className="ticket-code" dir="ltr">
                  {ticketCode(r.ticket_token)}
                </span>
                {!inside && (
                  <p className="ticket-note">
                    <ScanLine size={16} />
                    הציגי את המסך הזה בכניסה, ונסרוק אותו.
                  </p>
                )}
              </div>
            ) : (
              <div className="ticket-waiting">
                <span className="ticket-waiting-mark" aria-hidden="true">
                  <Clock3 size={26} />
                </span>
                <h2>{waiting[state].title}</h2>
                <p>{waiting[state].text}</p>
              </div>
            )}
            <ul className="ticket-facts">
              <li>
                <MapPin size={17} />
                <div>
                  <small>איפה</small>
                  <strong>{e.location}</strong>
                  {e.address && <span>{e.address}</span>}
                </div>
              </li>
            </ul>
          </div>
          <footer className="ticket-foot">
            <span>Koral Events</span>
            <i aria-hidden="true" />
            <span>״אישה לאישה מלכה״</span>
          </footer>
        </article>
        <div className="ticket-actions">
          {e.address && ready && (
            <a
              className="k-btn k-btn-ghost"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.address)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={17} /> ניווט למקום
            </a>
          )}
          <Link className="k-btn k-btn-ghost" href={`/events/${e.id}`}>
            לפרטי הערב <ArrowUpLeft size={17} />
          </Link>
        </div>
        {ready && !inside && (
          <p className="ticket-tip">
            <Sun size={14} /> הגבירי את בהירות המסך, והסריקה תהיה מיידית.
          </p>
        )}
      </main>
    </div>
  );
}
