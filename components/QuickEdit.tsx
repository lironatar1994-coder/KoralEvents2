"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Modal } from "./Modal";
import { Switch } from "./Switch";
import { api, fromLocalInput, toLocalInput } from "@/lib/client";
import { KoralEvent, dateLabel, timeLabel } from "@/lib/types";

export type QuickField =
  "title" | "starts_at" | "location" | "price" | "capacity" | "state";

/*
 * The facts that change after publishing: when, where, how much, how many,
 * open or closed. One sheet, one save. Image and the long description stay
 * in the full editor.
 */
export function QuickEdit({
  event,
  focus = "starts_at",
  onSaved,
  onClose,
}: {
  event: KoralEvent;
  focus?: QuickField;
  onSaved: (event: KoralEvent) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: event.title,
    subtitle: event.subtitle,
    category: event.category,
    starts_at: toLocalInput(event.starts_at),
    location: event.location,
    address: event.address,
    price: String(event.price),
    capacity: event.capacity === null ? "" : String(event.capacity),
    state: event.state,
    qr_enabled: event.qr_enabled,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const first = useRef<HTMLInputElement | HTMLSelectElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));
  let dateHint = "";
  try {
    const iso = fromLocalInput(form.starts_at);
    dateHint = `${dateLabel(iso, { weekday: "long" })} · ${timeLabel(iso)}`;
  } catch {
    dateHint = "";
  }
  const ref = (field: QuickField) => (field === focus ? first : undefined);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const starts_at = fromLocalInput(form.starts_at);
      const capacity =
        form.capacity.trim() === "" ? null : Number(form.capacity);
      const saved = await api<KoralEvent>(
        `/api/admin/events/${event.id}`,
        "PATCH",
        {
          ...event,
          title: form.title.trim(),
          subtitle: form.subtitle.trim(),
          category: form.category.trim(),
          starts_at,
          location: form.location.trim(),
          address: form.address.trim(),
          price: Number(form.price) || 0,
          capacity,
          state: form.state,
          qr_enabled: form.qr_enabled,
        },
      );
      onSaved(saved);
    } catch (e) {
      setError((e as Error).message || "לא הצלחנו לשמור. נסי שוב.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="עריכה מהירה" onClose={onClose}>
      <form className="quick-edit" onSubmit={submit}>
        <label>
          שם האירוע
          <input
            ref={ref("title") as React.RefObject<HTMLInputElement>}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            minLength={2}
            maxLength={120}
            required
          />
        </label>
        <label>
          משפט קצר
          <input
            value={form.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            maxLength={160}
          />
        </label>
        <label>
          תאריך ושעה · שעון ישראל
          <input
            ref={ref("starts_at") as React.RefObject<HTMLInputElement>}
            type="datetime-local"
            dir="ltr"
            value={form.starts_at}
            onChange={(e) => set("starts_at", e.target.value)}
            required
          />
        </label>
        <p className="field-hint date-hint" aria-live="polite">
          {dateHint || "אחרי הבחירה התאריך יופיע כאן בעברית."}
        </p>
        <label>
          שם המקום
          <input
            ref={ref("location") as React.RefObject<HTMLInputElement>}
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            minLength={2}
            maxLength={160}
            required
          />
        </label>
        <label>
          כתובת לניווט · לא חובה
          <input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            maxLength={250}
          />
        </label>
        <div className="quick-edit-row">
          <label>
            עלות בש״ח · 0 ללא עלות
            <input
              ref={ref("price") as React.RefObject<HTMLInputElement>}
              type="number"
              inputMode="numeric"
              min={0}
              max={100000}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
          </label>
          <label>
            מקומות · ריק ללא הגבלה
            <input
              ref={ref("capacity") as React.RefObject<HTMLInputElement>}
              type="number"
              inputMode="numeric"
              min={1}
              max={100000}
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
            />
          </label>
        </div>
        <label>
          מצב ההרשמה
          <select
            ref={ref("state") as React.RefObject<HTMLSelectElement>}
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
          >
            <option value="published">הרשמה פתוחה</option>
            <option value="closed">הרשמה סגורה</option>
            <option value="draft">טיוטה · לא מוצג באתר</option>
            {event.state === "archived" && (
              <option value="archived">בארכיון</option>
            )}
          </select>
        </label>
        <label>
          קטגוריה
          <input
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            maxLength={60}
            required
          />
        </label>
        <Switch
          checked={form.qr_enabled}
          onChange={(v) => set("qr_enabled", v)}
          label="כניסה עם QR"
          hint="כרטיס עם קוד QR לכל מאושרת, לשליחה בוואטסאפ ולסריקה בכניסה."
        />
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <button className="button gold-button full-width" disabled={busy}>
          {busy ? "שומרת…" : "שמירת השינויים"}
          {busy ? <Loader2 className="spin" size={17} /> : <Check size={17} />}
        </button>
        <p className="field-hint quick-edit-note">
          תמונה ותיאור מלא עורכים ב״עריכת האירוע״.
        </p>
      </form>
    </Modal>
  );
}
