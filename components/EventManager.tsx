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
  Users,
  Phone,
  MoreHorizontal,
  CheckCheck,
  ClipboardCopy,
  Download,
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
import { GuestStepper } from "./GuestStepper";
export function EventManager({
  initialEvent,
  initialRegistrations,
  initialFilter = "all",
}: {
  initialEvent: KoralEvent;
  initialRegistrations: Registration[];
  initialFilter?: "all" | "pending";
}) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [rows, setRows] = useState(initialRegistrations);
  const [filter, setFilter] = useState<string>(initialFilter);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Registration | "new" | null>(null);
  const [guests, setGuests] = useState(1);
  function open(target: Registration | "new") {
    setError("");
    setGuests(target === "new" ? 1 : target.guests);
    setEditing(target);
  }
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
  const order: Record<string, number> = {
    pending: 0,
    approved: 1,
    waitlist: 2,
    cancelled: 3,
  };
  const visible = [...rows]
    .sort(
      (a, b) =>
        order[a.status] - order[b.status] ||
        b.created_at.localeCompare(a.created_at),
    )
    .filter(
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
      {(() => {
        const count = (k: string) => rows.filter((r) => r.status === k).length;
        const approvedRows = rows.filter((r) => r.status === "approved");
        const unpaid = approvedRows.filter((r) => !r.paid).length;
        const total = rows.length || 1;
        const seg = (k: string) => `${(count(k) / total) * 100}%`;
        const left =
          event.capacity === null
            ? null
            : Math.max(0, event.capacity - event.approved);
        const chips: [string, string, number][] = [
          ["all", "הכול", rows.length],
          ["pending", "ממתינות", count("pending")],
          ["approved", "מאושרות", count("approved")],
          ["waitlist", "בהמתנה", count("waitlist")],
          ["unpaid", "לא שילמו", event.price > 0 ? unpaid : 0],
          ["cancelled", "בוטלו", count("cancelled")],
        ];
        return (
          <>
            <section className="roster-overview" aria-label="סיכום האירוע">
              <div className="roster-numbers">
                <div className="roster-big">
                  <strong>{event.approved}</strong>
                  <span>
                    מאושרות
                    {event.capacity !== null && ` מתוך ${event.capacity}`}
                  </span>
                </div>
                <div className="roster-facts">
                  {event.pending > 0 && (
                    <button
                      className="roster-fact is-hot"
                      onClick={() => setFilter("pending")}
                    >
                      <b>{event.pending}</b> ממתינות לאישור
                    </button>
                  )}
                  {left !== null && (
                    <span
                      className={`roster-fact ${left === 0 ? "is-full" : ""}`}
                    >
                      <b>{left}</b> {left === 0 ? "מלא" : "פנויים"}
                    </span>
                  )}
                  {event.waitlist > 0 && (
                    <span className="roster-fact">
                      <b>{event.waitlist}</b> ברשימת המתנה
                    </span>
                  )}
                  {event.price > 0 && approvedRows.length > 0 && (
                    <button
                      className={`roster-fact ${unpaid ? "is-unpaid" : "is-ok"}`}
                      onClick={() => setFilter(unpaid ? "unpaid" : "approved")}
                    >
                      <b>{approvedRows.length - unpaid}</b> שילמו
                      {unpaid > 0 && ` · ${unpaid} עוד לא`}
                    </button>
                  )}
                </div>
              </div>
              {rows.length > 0 && (
                <div
                  className="status-bar"
                  role="img"
                  aria-label={`${count("approved")} מאושרות, ${count("pending")} ממתינות, ${count("waitlist")} ברשימת המתנה, ${count("cancelled")} בוטלו`}
                >
                  <i
                    className="seg-approved"
                    style={{ width: seg("approved") }}
                  />
                  <i
                    className="seg-pending"
                    style={{ width: seg("pending") }}
                  />
                  <i
                    className="seg-waitlist"
                    style={{ width: seg("waitlist") }}
                  />
                  <i
                    className="seg-cancelled"
                    style={{ width: seg("cancelled") }}
                  />
                </div>
              )}
            </section>
            <div className="attendees-heading">
              <div>
                <h2>המשתתפות</h2>
              </div>
              <button
                className="button gold-button"
                onClick={() => open("new")}
              >
                <Plus size={18} />
                הוספת משתתפת
              </button>
            </div>
            <div className="roster-toolbar">
              <div
                className="roster-chips"
                role="group"
                aria-label="סינון משתתפות"
              >
                {chips
                  .filter(([k, , n]) => k === "all" || n > 0)
                  .map(([k, label, n]) => (
                    <button
                      key={k}
                      className={`chip chip-${k} ${filter === k ? "selected" : ""}`}
                      aria-pressed={filter === k}
                      onClick={() => setFilter(k)}
                    >
                      {label} <b>{n}</b>
                    </button>
                  ))}
              </div>
              <div className="roster-search">
                <label className="search-field">
                  <Search size={18} />
                  <input
                    aria-label="חיפוש משתתפת לפי שם או טלפון"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="חיפוש לפי שם או טלפון"
                  />
                </label>
                {visible.length > 0 && (
                  <div className="roster-bulk">
                    {filter === "pending" && visible.length > 1 && (
                      <button
                        className="button outline-button small-button"
                        disabled={busy}
                        onClick={() => {
                          if (
                            !confirm(
                              `לאשר את כל ${visible.length} הממתינות? אם המקומות ייגמרו באמצע, נעצור.`,
                            )
                          )
                            return;
                          action(async () => {
                            for (const r of visible)
                              await api(
                                `${base}/registrations/${r.id}`,
                                "PATCH",
                                {
                                  ...r,
                                  status: "approved",
                                },
                              );
                          }, `אושרו ${visible.length} משתתפות`);
                        }}
                      >
                        <CheckCheck size={16} />
                        אישור כל הממתינות
                      </button>
                    )}
                    <button
                      className="button outline-button small-button"
                      disabled={busy}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            visible.map((r) => r.phone).join("\n"),
                          );
                          setError("");
                          setNotice(
                            `הועתקו ${visible.length} מספרי טלפון. אפשר להדביק בקבוצת וואטסאפ.`,
                          );
                        } catch {
                          setError("לא הצלחנו להעתיק. נסי שוב.");
                        }
                      }}
                    >
                      <ClipboardCopy size={16} />
                      העתקת טלפונים
                    </button>
                    <button
                      className="button outline-button small-button"
                      onClick={() => {
                        const lines = [
                          ["שם", "טלפון", "מוזמנות", "מצב", "שולם", "נרשמה"],
                          ...visible.map((r) => [
                            r.name,
                            r.phone,
                            r.guests,
                            statusLabels[r.status],
                            event.price > 0 ? (r.paid ? "כן" : "לא") : "",
                            new Date(r.created_at).toLocaleString("he-IL", {
                              timeZone: "Asia/Jerusalem",
                            }),
                          ]),
                        ];
                        const csv =
                          "\ufeff" +
                          lines
                            .map((l) =>
                              l
                                .map(
                                  (v) => `"${String(v).replace(/"/g, '""')}"`,
                                )
                                .join(","),
                            )
                            .join("\r\n");
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(
                          new Blob([csv], { type: "text/csv;charset=utf-8" }),
                        );
                        a.download = `${event.title} - משתתפות.csv`;
                        a.click();
                        URL.revokeObjectURL(a.href);
                      }}
                    >
                      <Download size={16} />
                      אקסל
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}
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
      <div className="attendee-list roster-list">
        {visible.map((row) => (
          <article
            key={row.id}
            className={`attendee-card attendee-row row-${row.status}`}
          >
            <span className="avatar">{row.name.trim()[0]}</span>
            <div className="row-main">
              <h3>{row.name}</h3>
              <div className="row-meta">
                <a href={`tel:${row.phone}`} dir="ltr">
                  {row.phone}
                </a>
                <span className="row-when">
                  נרשמה {dateLabel(row.created_at)}
                </span>
                <span className={`badge status-${row.status}`}>
                  {statusLabels[row.status]}
                </span>
                {row.guests > 1 && (
                  <span
                    className="guests-chip"
                    title={`${row.guests} מוזמנות על השם הזה`}
                  >
                    ×{row.guests}
                  </span>
                )}
                {event.price > 0 && row.status === "approved" && (
                  <button
                    className={`payment-toggle ${row.paid ? "is-paid" : ""}`}
                    disabled={busy}
                    aria-label={`${row.name}: ${row.paid ? "שולם, לחצי לביטול הסימון" : "לא שולם, לחצי לסימון שולם"}`}
                    onClick={() => update(row, { paid: !row.paid })}
                  >
                    {row.paid ? (
                      <Check size={13} />
                    ) : (
                      <span className="payment-dot" />
                    )}
                    {row.paid ? "שולם" : "לא שולם"}
                  </button>
                )}
              </div>
            </div>
            <div className="row-actions">
              {row.status !== "approved" && row.status !== "cancelled" && (
                <button
                  className="row-action approve"
                  disabled={busy}
                  aria-label="אישור השתתפות"
                  title="אישור השתתפות"
                  onClick={() => update(row, { status: "approved" })}
                >
                  <Check size={19} />
                </button>
              )}
              <a
                className="row-action"
                aria-label={`התקשרות ל${row.name}`}
                title="התקשרות"
                href={`tel:${row.phone}`}
              >
                <Phone size={18} />
              </a>
              {row.status !== "approved" && (
                <a
                  className="row-action whatsapp"
                  aria-label={`וואטסאפ ל${row.name}`}
                  title="וואטסאפ"
                  href={`https://wa.me/972${row.phone.slice(1)}?text=${encodeURIComponent(`היי ${row.name}, כאן Koral Events לגבי ״${event.title}״. `)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={18} />
                </a>
              )}
              {row.status === "approved" && (
                <a
                  className="row-action whatsapp"
                  aria-label="שליחת אישור בוואטסאפ"
                  title="שליחת אישור בוואטסאפ"
                  href={`https://wa.me/972${row.phone.slice(1)}?text=${encodeURIComponent(`היי ${row.name}, ההשתתפות שלך ב״${event.title}״ אושרה! נפגשות ב-${dateLabel(event.starts_at)} בשעה ${timeLabel(event.starts_at)}, ${event.location}${event.address ? `, ${event.address}` : ""}. ${event.price > 0 ? `עלות ההשתתפות: ₪${event.price}. התשלום בתיאום איתי. ` : ""}כל הפרטים: ${typeof window !== "undefined" ? window.location.origin : ""}${appPath(`/events/${event.id}`)}\nמחכה לראותך, Koral Events`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={19} />
                </a>
              )}
              <button
                className="row-action"
                aria-label={`עריכת ${row.name}`}
                title="עריכה, ביטול והסרה"
                disabled={busy}
                onClick={() => open(row)}
              >
                <MoreHorizontal size={19} />
              </button>
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
                guests,
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
            <GuestStepper
              value={guests}
              onChange={setGuests}
              max={10}
              label="כמה מוזמנות על השם הזה?"
              hint={guests === 1 ? "היא לבד" : `היא ועוד ${guests - 1}`}
            />
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
            {editing !== "new" && editing.status !== "cancelled" && (
              <button
                className="button outline-button full-width cancel-button"
                disabled={busy}
                type="button"
                onClick={async () => {
                  if (
                    confirm(
                      `לבטל את ההרשמה של ${editing.name}? המקום שלה יתפנה.`,
                    )
                  ) {
                    const success = await action(
                      () =>
                        api(`${base}/registrations/${editing.id}`, "PATCH", {
                          ...editing,
                          status: "cancelled",
                        }),
                      "ההרשמה בוטלה",
                    );
                    if (success) setEditing(null);
                  }
                }}
              >
                ביטול ההרשמה
              </button>
            )}
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
