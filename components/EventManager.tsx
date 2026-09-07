"use client";
import { appPath } from "@/lib/paths";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpLeft,
  Plus,
  Search,
  Check,
  Pencil,
  Share2,
  Copy,
  Archive,
  LockKeyhole,
  Unlock,
  MessageCircle,
  Trash2,
  X,
  Users,
} from "lucide-react";
import {
  KoralEvent,
  Registration,
  RegistrationState,
  dateLabel,
  timeLabel,
  eventStateLabels,
  statusLabels,
} from "@/lib/types";
import { api } from "@/lib/client";
import { EventImage } from "./Public";
import { Modal } from "./Modal";
export function EventManager({
  initialEvent,
  initialRegistrations,
}: {
  initialEvent: KoralEvent;
  initialRegistrations: Registration[];
}) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [rows, setRows] = useState(initialRegistrations);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Registration | "new" | null>(null);
  const base = `/api/admin/events/${event.id}`;
  async function refresh() {
    const [e, r] = await Promise.all([
      api<KoralEvent>(base),
      api<Registration[]>(`${base}/registrations`),
    ]);
    setEvent(e);
    setRows(r);
    router.refresh();
  }
  async function action(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      await refresh();
      setNotice(message);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function update(row: Registration, changes: Partial<Registration>) {
    await action(
      () =>
        api(`${base}/registrations/${row.id}`, "PATCH", { ...row, ...changes }),
      "הפרטים עודכנו",
    );
  }
  const visible = rows.filter(
    (r) =>
      (filter === "all" ||
        (filter === "unpaid"
          ? !r.paid && r.status === "approved"
          : r.status === filter)) &&
      `${r.name} ${r.phone}`.includes(search.trim()),
  );
  async function share() {
    const url = `${location.origin}${appPath(`/events/${event.id}`)}`;
    try {
      if (navigator.share) await navigator.share({ title: event.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setNotice("הקישור הועתק. אפשר לשלוח אותו למשתתפות.");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setError(
          "לא ניתן לשתף כרגע. אפשר לפתוח את עמוד האירוע ולהעתיק את הכתובת.",
        );
    }
  }
  return (
    <main id="main" className="admin-main">
      <Link href="/admin" className="back-link">
        <ArrowRight size={17} />
        כל האירועים
      </Link>
      <section className="manager-hero">
        <div className="manager-hero-image">
          <EventImage event={event} />
        </div>
        <div>
          <span className={`badge state-${event.state}`}>
            {eventStateLabels[event.state]}
          </span>
          <h1>{event.title}</h1>
          <p>
            {dateLabel(event.starts_at)} · {timeLabel(event.starts_at)} ·{" "}
            {event.location}
          </p>
          <div className="manager-hero-actions">
            <Link
              className="button outline-button small-button"
              href={`/admin/events/${event.id}/edit`}
            >
              <Pencil size={16} />
              עריכת האירוע
            </Link>
            {(event.state === "published" || event.state === "closed") && (
              <>
                <button
                  className="button outline-button small-button"
                  onClick={share}
                >
                  <Share2 size={16} />
                  שיתוף
                </button>
                <Link
                  className="icon-button"
                  aria-label="צפייה בעמוד האירוע"
                  href={`/events/${event.id}`}
                  target="_blank"
                >
                  <ArrowUpLeft size={20} />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
      <section className="stats-grid four-stats" aria-label="סיכום האירוע">
        <div className="stat-card">
          <strong>
            {event.approved}
            <small>{event.capacity ? ` / ${event.capacity}` : ""}</small>
          </strong>
          <span>משתתפות מאושרות</span>
        </div>
        <div className="stat-card">
          <strong>{event.pending}</strong>
          <span>ממתינות לאישור</span>
        </div>
        <div className="stat-card">
          <strong>{event.waitlist}</strong>
          <span>ברשימת המתנה</span>
        </div>
        <div className="stat-card">
          <strong>
            {event.capacity === null
              ? "∞"
              : Math.max(0, event.capacity - event.approved)}
          </strong>
          <span>מקומות פנויים</span>
        </div>
      </section>
      <div className="attendees-heading">
        <div>
          <h2>המשתתפות</h2>
          <p>אישור, תשלום ווואטסאפ, הכול מכאן.</p>
        </div>
        <button
          className="button gold-button"
          onClick={() => {
            setError("");
            setEditing("new");
          }}
        >
          <Plus size={18} />
          הוספת משתתפת
        </button>
      </div>
      <div className="attendees-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="חיפוש משתתפת לפי שם או טלפון"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם או טלפון"
          />
        </label>
        <select
          aria-label="סינון משתתפות"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">כל המשתתפות ({rows.length})</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v} ({rows.filter((r) => r.status === k).length})
            </option>
          ))}
          {event.price > 0 && (
            <option value="unpaid">מאושרות שטרם שילמו</option>
          )}
        </select>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="success-message" role="status">
          <Check size={17} />
          {notice}
        </p>
      )}
      <div className="attendee-list">
        {visible.map((row) => (
          <article key={row.id} className="attendee-card">
            <div className="attendee-person">
              <span className="avatar">{row.name.trim()[0]}</span>
              <div>
                <h3>{row.name}</h3>
                <a href={`tel:${row.phone}`} dir="ltr">
                  {row.phone}
                </a>
              </div>
              <button
                className="icon-button attendee-edit"
                aria-label={`עריכת ${row.name}`}
                disabled={busy}
                onClick={() => {
                  setError("");
                  setEditing(row);
                }}
              >
                <Pencil size={17} />
              </button>
            </div>
            <div className="attendee-status">
              <span className={`badge status-${row.status}`}>
                {statusLabels[row.status]}
              </span>
              {event.price === 0 ? (
                <span className="free-label">ללא עלות</span>
              ) : (
                <button
                  className={`payment-toggle ${row.paid ? "is-paid" : ""}`}
                  disabled={busy}
                  aria-label={`${row.name}: ${row.paid ? "שולם, לחצי לביטול הסימון" : "לא שולם, לחצי לסימון שולם"}`}
                  onClick={() => update(row, { paid: !row.paid })}
                >
                  {row.paid ? (
                    <Check size={14} />
                  ) : (
                    <span className="payment-dot" />
                  )}
                  {row.paid ? "שולם" : "לא שולם"}
                </button>
              )}
            </div>
            <div className="attendee-actions">
              {row.status !== "approved" && (
                <button
                  className="button approve-button small-button"
                  disabled={busy}
                  onClick={() => update(row, { status: "approved" })}
                >
                  <Check size={16} />
                  אישור השתתפות
                </button>
              )}
              {row.status === "approved" && (
                <a
                  className="button whatsapp-button small-button"
                  href={`https://wa.me/972${row.phone.slice(1)}?text=${encodeURIComponent(`היי ${row.name}, ההשתתפות שלך ב״${event.title}״ אושרה! נפגשות ב-${dateLabel(event.starts_at)} בשעה ${timeLabel(event.starts_at)}, ${event.location}${event.address ? `, ${event.address}` : ""}. ${event.price > 0 ? `עלות ההשתתפות: ₪${event.price}. התשלום בתיאום איתי. ` : ""}כל הפרטים: ${typeof window !== "undefined" ? window.location.origin : ""}${appPath(`/events/${event.id}`)}\nמחכה לראותך, Koral Events`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} />
                  שליחת אישור בוואטסאפ
                </a>
              )}
              {row.status !== "cancelled" && (
                <button
                  className="icon-button"
                  disabled={busy}
                  aria-label={`ביטול הרשמה של ${row.name}`}
                  onClick={() => {
                    if (
                      confirm(`לבטל את ההרשמה של ${row.name}? המקום שלה יתפנה.`)
                    )
                      update(row, { status: "cancelled" });
                  }}
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </article>
        ))}
        {!visible.length && (
          <div className="admin-empty">
            <Users size={30} />
            <h3>
              {rows.length ? "לא מצאנו אף אחת" : "המשתתפות הראשונות בדרך"}
            </h3>
            <p>
              {rows.length
                ? "נסי שם אחר, או שני את הסינון."
                : "שתפי את קישור האירוע או הוסיפי משתתפת בעצמך."}
            </p>
          </div>
        )}
      </div>
      <section className="event-tools">
        <h3>עוד פעולות</h3>
        <div>
          <button
            className="button outline-button small-button"
            disabled={busy}
            onClick={() =>
              action(async () => {
                const data = await api<{ id: string }>(
                  "/api/admin/events",
                  "POST",
                  { ...event, title: `${event.title} — עותק`, state: "draft" },
                );
                router.push(`/admin/events/${data.id}/edit`);
              }, "נוצר עותק כטיוטה")
            }
          >
            <Copy size={16} />
            שכפול אירוע
          </button>
          <button
            className="button outline-button small-button"
            disabled={busy}
            onClick={() => {
              const state =
                event.state === "published" ? "closed" : "published";
              if (
                confirm(
                  state === "closed"
                    ? "לסגור את ההרשמה? עמוד האירוע יישאר זמין."
                    : "לפרסם את האירוע ולפתוח הרשמה?",
                )
              )
                action(
                  () => api(base, "PATCH", { ...event, state }),
                  "מצב האירוע עודכן",
                );
            }}
          >
            {event.state === "published" ? (
              <LockKeyhole size={16} />
            ) : (
              <Unlock size={16} />
            )}{" "}
            {event.state === "published" ? "סגירת הרשמה" : "פרסום ופתיחת הרשמה"}
          </button>
          {event.state !== "archived" && (
            <button
              className="button outline-button small-button"
              disabled={busy}
              onClick={() => {
                if (
                  confirm(
                    "להעביר את האירוע לארכיון? הוא יוסר מהאתר הציבורי, והמשתתפות יישמרו.",
                  )
                )
                  action(
                    () => api(base, "PATCH", { ...event, state: "archived" }),
                    "האירוע הועבר לארכיון",
                  );
              }}
            >
              <Archive size={16} />
              העברה לארכיון
            </button>
          )}
        </div>
      </section>
      {editing && (
        <Modal
          title={editing === "new" ? "הוספת משתתפת" : "עריכת משתתפת"}
          onClose={() => {
            if (!busy) setEditing(null);
          }}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const payload = {
                name: data.get("name"),
                phone: data.get("phone"),
                ...(editing !== "new"
                  ? { status: data.get("status"), paid: editing.paid }
                  : {}),
              };
              const success = await action(
                () =>
                  api(
                    `${base}/registrations${editing === "new" ? "" : `/${editing.id}`}`,
                    editing === "new" ? "POST" : "PATCH",
                    payload,
                  ),
                editing === "new"
                  ? "המשתתפת נוספה וממתינה לאישור"
                  : "פרטי המשתתפת נשמרו",
              );
              if (success) setEditing(null);
            }}
          >
            <label>
              שם מלא
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                defaultValue={editing === "new" ? "" : editing.name}
              />
            </label>
            <label>
              מספר טלפון
              <input
                type="tel"
                name="phone"
                dir="ltr"
                required
                maxLength={20}
                defaultValue={editing === "new" ? "" : editing.phone}
              />
            </label>
            {editing !== "new" && (
              <label>
                מצב ההרשמה
                <select name="status" defaultValue={editing.status}>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <option value={k} key={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {editing === "new" && (
              <p className="field-hint">
                היא תיכנס כממתינה לאישור, או לרשימת המתנה אם הערב מלא. את מאשרת
                אחר כך.
              </p>
            )}
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <button className="button gold-button full-width" disabled={busy}>
              {busy ? "שומרת…" : "שמירת פרטים"}
              <Check size={17} />
            </button>
            {editing !== "new" && (
              <button
                className="delete-button"
                disabled={busy}
                type="button"
                onClick={async () => {
                  if (
                    confirm(
                      `להסיר לצמיתות את ${editing.name}? הפעולה תמחק גם את סימון התשלום.`,
                    )
                  ) {
                    const success = await action(
                      () =>
                        api(`${base}/registrations/${editing.id}`, "DELETE"),
                      "המשתתפת הוסרה",
                    );
                    if (success) setEditing(null);
                  }
                }}
              >
                <Trash2 size={16} />
                הסרת המשתתפת לצמיתות
              </button>
            )}
          </form>
        </Modal>
      )}
    </main>
  );
}
