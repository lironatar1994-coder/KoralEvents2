"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  ArrowLeft,
  Users,
  CalendarDays,
  ImagePlus,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  KoralEvent,
  dateLabel,
  timeLabel,
  eventStateLabels,
} from "@/lib/types";
import { EventImage } from "./Public";
import { dashboardGroups } from "@/lib/dashboard";
export function AdminDashboard({ events }: { events: KoralEvent[] }) {
  const [tab, setTab] = useState<"upcoming" | "draft" | "archive" | "pending">(
    "upcoming",
  );
  const groups = dashboardGroups(events);
  const filtered = groups[tab];
  const live = groups.upcoming;
  const pending = live.reduce((n, e) => n + e.pending, 0);
  const approved = live.reduce((n, e) => n + e.approved, 0);
  const firstTime = events.length === 0;
  return (
    <main id="main" className="admin-main dashboard-main">
      <div className="admin-title-row">
        <div>
          <h1>
            האירועים<span className="gold">.</span>
          </h1>
        </div>
        {!firstTime && (
          <Link className="button gold-button" href="/admin/events/new">
            <Plus size={19} /> יצירת אירוע
          </Link>
        )}
      </div>
      {live.length > 0 && (
        <section
          className="dashboard-summary"
          aria-label="סיכום האירועים הקרובים"
        >
          <span>
            <strong>{live.length}</strong> אירועים קרובים
          </span>
          <span>
            <strong>{approved}</strong> מאושרות
          </span>
          {pending === 0 && (
            <span className="all-clear">אין בקשות שממתינות לאישור</span>
          )}
        </section>
      )}
      {pending > 0 && (
        <button
          className="pending-action"
          onClick={() => setTab(tab === "pending" ? "upcoming" : "pending")}
          aria-pressed={tab === "pending"}
        >
          <span>
            <strong>{pending}</strong> בקשות ממתינות לאישור
            {tab === "pending" && (
              <small>מוצגים רק אירועים עם בקשות, לפי הדחיפות</small>
            )}
          </span>
          <span>
            {tab === "pending" ? "הצגת כל האירועים" : "לטיפול"}
            <ArrowLeft size={18} />
          </span>
        </button>
      )}
      {!firstTime && (
        <div className="tabs" aria-label="סינון אירועים">
          {[
            ["upcoming", "קרובים"],
            ...(pending > 0 ? [["pending", "ממתינות לאישור"]] : []),
            ["draft", "טיוטות"],
            ["archive", "עברו וארכיון"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={tab === key ? "selected" : ""}
              aria-pressed={tab === key}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {firstTime ? (
        <section className="admin-onboarding">
          <div className="onboarding-copy">
            <span className="onboarding-spark" aria-hidden="true">
              <Sparkles size={22} />
            </span>
            <h2>הערב הראשון מתחיל כאן.</h2>
            <p>
              שלושה מסכים קצרים, ויש לך עמוד אירוע מעוצב עם הרשמה. משתפות את
              הקישור, ומכאן את מאשרת.
            </p>
            <Link className="button gold-button" href="/admin/events/new">
              <Plus size={19} /> יצירת האירוע הראשון
            </Link>
          </div>
          <ol className="onboarding-steps" aria-label="איך זה עובד">
            <li>
              <ImagePlus size={20} />
              <b>תמונה ושם</b>
              <span>צילום או פלייר, ושם שעושה חשק</span>
            </li>
            <li>
              <MapPin size={20} />
              <b>מתי ואיפה</b>
              <span>תאריך, שעה ומקום. הכתובת פותחת ניווט</span>
            </li>
            <li>
              <Users size={20} />
              <b>מקומות ועלות</b>
              <span>כמה מקומות, ואם יש עלות. מלא? רשימת המתנה</span>
            </li>
          </ol>
        </section>
      ) : (
        <div className="admin-events">
          {filtered.map((e) => (
            <Link
              className="admin-event-card"
              key={e.id}
              href={`/admin/events/${e.id}${tab === "pending" ? "?status=pending" : ""}`}
            >
              <div className="admin-event-image">
                <EventImage event={e} />
              </div>
              <div className="admin-event-body">
                <span className={`badge state-${e.state}`}>
                  {eventStateLabels[e.state]}
                </span>
                <h2>{e.title}</h2>
                <p className="event-date">
                  {dateLabel(e.starts_at, { weekday: "long" })} ·{" "}
                  {timeLabel(e.starts_at)}
                </p>
                <p className="event-location">{e.location}</p>
                <div className="admin-event-counts">
                  <span>
                    <b>{e.approved}</b> מאושרות
                  </span>
                  {e.pending > 0 && (
                    <span className="is-hot">
                      <b>{e.pending}</b> ממתינות לאישור
                    </span>
                  )}
                  <span>
                    {e.capacity === null ? (
                      "ללא מכסה"
                    ) : (
                      <>
                        <b>{Math.max(0, e.capacity - e.approved)}</b> פנויים
                      </>
                    )}
                  </span>
                </div>
              </div>
              <ArrowLeft className="admin-event-arrow" size={22} />
            </Link>
          ))}
          {!filtered.length && (
            <div className="admin-empty">
              <CalendarDays size={28} />
              <h2>
                {tab === "draft"
                  ? "אין טיוטות כרגע"
                  : tab === "archive"
                    ? "הארכיון ריק"
                    : tab === "pending"
                      ? "אין בקשות שממתינות לאישור"
                      : "אין אירועים קרובים כרגע"}
              </h2>
              <p>
                {tab === "draft"
                  ? "אירוע ששמרת בלי לפרסם יופיע כאן."
                  : tab === "archive"
                    ? "אירועים שעברו או שהועברו לארכיון יופיעו כאן."
                    : "אפשר לעבור לטיוטות או ליצור אירוע חדש."}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
