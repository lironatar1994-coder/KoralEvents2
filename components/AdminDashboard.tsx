"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus, ArrowLeft, Users, Clock3, CalendarDays } from "lucide-react";
import {
  KoralEvent,
  dateLabel,
  timeLabel,
  eventStateLabels,
} from "@/lib/types";
import { EventImage } from "./Public";
export function AdminDashboard({ events }: { events: KoralEvent[] }) {
  const [tab, setTab] = useState("upcoming");
  const upcoming = events.filter(
    (e) => e.state !== "archived" && new Date(e.starts_at) > new Date(),
  );
  const filtered = events.filter((e) =>
    tab === "archive"
      ? e.state === "archived" || new Date(e.starts_at) <= new Date()
      : tab === "draft"
        ? e.state === "draft"
        : e.state !== "archived" &&
          e.state !== "draft" &&
          new Date(e.starts_at) > new Date(),
  );
  return (
    <main id="main" className="admin-main">
      <div className="admin-title-row">
        <div>
          <h1>
            האירועים שלך<span className="gold">.</span>
          </h1>
          <p>מה קרוב, מי נרשמה, ומה הבא.</p>
        </div>
        <Link className="button gold-button" href="/admin/events/new">
          <Plus size={19} /> יצירת אירוע
        </Link>
      </div>
      <section className="stats-grid" aria-label="סיכום האירועים הקרובים">
        <div className="stat-card">
          <CalendarDays />
          <strong>{upcoming.filter((e) => e.state !== "draft").length}</strong>
          <span>אירועים קרובים</span>
        </div>
        <div className="stat-card">
          <Clock3 />
          <strong>{upcoming.reduce((n, e) => n + e.pending, 0)}</strong>
          <span>בקשות שמחכות לך</span>
        </div>
        <div className="stat-card">
          <Users />
          <strong>{upcoming.reduce((n, e) => n + e.approved, 0)}</strong>
          <span>משתתפות מאושרות</span>
        </div>
      </section>
      <div className="tabs" aria-label="סינון אירועים">
        {[
          ["upcoming", "קרובים"],
          ["draft", "טיוטות"],
          ["archive", "עברו וארכיון"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? "selected" : ""}
            aria-pressed={tab === key}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="admin-events">
        {filtered.map((e) => (
          <Link
            className="admin-event-card"
            key={e.id}
            href={`/admin/events/${e.id}`}
          >
            <div className="admin-event-image">
              <EventImage event={e} />
            </div>
            <div className="admin-event-body">
              <span className={`badge state-${e.state}`}>
                {eventStateLabels[e.state]}
              </span>
              <h2>{e.title}</h2>
              <p>
                {dateLabel(e.starts_at)} · {timeLabel(e.starts_at)} ·{" "}
                {e.location}
              </p>
              <div className="admin-event-counts">
                <span>
                  <b>{e.approved}</b> מאושרות
                </span>
                <span>
                  <b>{e.pending}</b> ממתינות
                </span>
                <span>
                  {e.capacity === null ? (
                    "ללא מכסה"
                  ) : (
                    <>
                      <b>{Math.max(0, e.capacity - e.approved)}</b> מקומות
                      פנויים
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
            <CalendarDays size={32} />
            <h2>
              {tab === "draft"
                ? "אין טיוטות כרגע"
                : tab === "archive"
                  ? "הארכיון ריק"
                  : "הערב הבא מתחיל כאן"}
            </h2>
            <p>תמונה, כמה פרטים, ואפשר להזמין.</p>
            <Link className="button outline-button" href="/admin/events/new">
              <Plus size={18} />
              יצירת אירוע חדש
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
