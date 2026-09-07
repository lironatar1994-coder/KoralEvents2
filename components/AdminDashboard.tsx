"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  ArrowLeft,
  Users,
  Clock3,
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
  const live = upcoming.filter((e) => e.state !== "draft");
  const pending = upcoming.reduce((n, e) => n + e.pending, 0);
  const approved = upcoming.reduce((n, e) => n + e.approved, 0);
  const firstTime = live.length === 0 && tab === "upcoming";
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
      {live.length > 0 && (
        <section className="overview" aria-label="סיכום האירועים הקרובים">
          <div>
            <CalendarDays />
            <strong>{live.length}</strong>
            <span>אירועים קרובים</span>
          </div>
          <div className={pending ? "is-hot" : ""}>
            <Clock3 />
            <strong>{pending}</strong>
            <span>בקשות שמחכות לך</span>
          </div>
          <div>
            <Users />
            <strong>{approved}</strong>
            <span>משתתפות מאושרות</span>
          </div>
        </section>
      )}
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
                  {dateLabel(e.starts_at, { weekday: "long" })} ·{" "}
                  {timeLabel(e.starts_at)} · {e.location}
                </p>
                <div className="admin-event-counts">
                  <span>
                    <b>{e.approved}</b> מאושרות
                  </span>
                  <span className={e.pending ? "is-hot" : ""}>
                    <b>{e.pending}</b> ממתינות
                  </span>
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
              <h2>{tab === "draft" ? "אין טיוטות כרגע" : "הארכיון ריק"}</h2>
              <p>
                {tab === "draft"
                  ? "אירוע ששמרת בלי לפרסם יופיע כאן."
                  : "אירועים שעברו או שהועברו לארכיון יופיעו כאן."}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
