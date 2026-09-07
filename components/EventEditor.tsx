"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  Eye,
  Check,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { KoralEvent, dateLabel, timeLabel, priceLabel } from "@/lib/types";
import { api, toLocalInput, fromLocalInput } from "@/lib/client";
import { Modal } from "./Modal";
const steps = ["תמונה ושם", "מתי ואיפה", "מקומות ועלות"];
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
function firstInvalid(scope: HTMLElement): Control | null {
  return (
    Array.from(scope.querySelectorAll<Control>("input, select, textarea")).find(
      (c) => !c.checkValidity(),
    ) || null
  );
}
export function EventEditor({ event }: { event?: KoralEvent }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState({
    title: event?.title || "",
    subtitle: event?.subtitle || "",
    description: event?.description || "",
    starts_at: event ? toLocalInput(event.starts_at) : "",
    location: event?.location || "",
    address: event?.address || "",
    price: event?.price || 0,
    capacity: event?.capacity?.toString() || "",
    image: event?.image || "",
    image_mode: event?.image_mode || "cover",
    category: event?.category || "מפגש לנשים",
  });
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    function leave(e: MouseEvent) {
      const link = (e.target as Element).closest("a");
      if (
        dirty &&
        link &&
        link.target !== "_blank" &&
        !link.getAttribute("href")?.startsWith("#") &&
        !confirm("יש שינויים שלא נשמרו. לצאת בכל זאת?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", leave, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", leave, true);
    };
  }, [dirty]);
  function set(key: string, value: string | number) {
    setDirty(true);
    setForm((p) => ({ ...p, [key]: value }));
  }
  function goTo(next: number) {
    setStep(next);
    window.scrollTo({ top: 0 });
  }
  // Steps that are not on screen cannot show a browser validation bubble,
  // so jump to the step that holds the first invalid field first.
  function validateAll() {
    const f = formRef.current;
    if (!f) return false;
    const bad = firstInvalid(f);
    if (!bad) return true;
    const owner = Number(
      bad.closest("fieldset.editor-step")?.getAttribute("data-step") ?? step,
    );
    if (owner !== step) {
      goTo(owner);
      setTimeout(() => bad.reportValidity(), 60);
    } else bad.reportValidity();
    return false;
  }
  function nextStep() {
    const scope = formRef.current?.querySelector<HTMLElement>(
      `fieldset[data-step="${step}"]`,
    );
    const bad = scope && firstInvalid(scope);
    if (bad) {
      bad.reportValidity();
      return;
    }
    goTo(step + 1);
  }
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("יש לבחור תמונה עד 10MB");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const data = new FormData();
      data.set("file", file);
      const r = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      set("image", result.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  async function save(state: string) {
    setBusy(true);
    setError("");
    try {
      if (state === "published" && !form.image)
        throw Error("הוסיפי תמונה לפני פרסום האירוע");
      const payload = {
        ...form,
        starts_at: fromLocalInput(form.starts_at),
        price: Number(form.price),
        capacity: form.capacity ? Number(form.capacity) : null,
        state,
      };
      const result = await api<{ id: string }>(
        event ? `/api/admin/events/${event.id}` : "/api/admin/events",
        event ? "PATCH" : "POST",
        payload,
      );
      setDirty(false);
      router.push(`/admin/events/${result.id}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  let dateHint = "";
  if (form.starts_at) {
    try {
      const iso = fromLocalInput(form.starts_at);
      dateHint = `${dateLabel(iso, { weekday: "long" })} · ${timeLabel(iso)}`;
    } catch {
      dateHint = "";
    }
  }
  const saveButton = (
    <button
      key="save"
      className="button outline-button"
      type="button"
      disabled={busy || uploading}
      onClick={() => {
        if (validateAll()) save(event?.state || "draft");
      }}
    >
      {busy ? "שומרת…" : event ? "שמירת שינויים" : "שמירה כטיוטה"}
    </button>
  );
  return (
    <main id="main" className="admin-main editor-main">
      <Link
        href={event ? `/admin/events/${event.id}` : "/admin"}
        className="back-link"
      >
        <ArrowRight size={17} />
        חזרה
      </Link>
      <div className="admin-title-row">
        <div>
          <h1>{event ? "הפרטים הקטנים." : "בואי ניצור מפגש מיוחד."}</h1>
          <p>שלושה מסכים קצרים, ואת מוכנה לפרסם.</p>
        </div>
      </div>
      <form
        ref={formRef}
        className="editor-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!validateAll()) return;
          try {
            fromLocalInput(form.starts_at);
            setError("");
            setPreview(true);
          } catch (error) {
            setError((error as Error).message);
          }
        }}
      >
        <ol className="wizard-steps" aria-label="שלבי יצירת האירוע">
          {steps.map((title, i) => (
            <li
              key={title}
              className={i === step ? "is-active" : i < step ? "is-done" : ""}
              aria-current={i === step ? "step" : undefined}
            >
              <span>{i < step ? <Check size={13} /> : i + 1}</span>
              {title}
            </li>
          ))}
        </ol>
        <fieldset
          className="editor-step editor-panel"
          data-step={0}
          hidden={step !== 0}
        >
          <div className="panel-title">
            <h2>מתחילות באווירה</h2>
          </div>
          <label className={`upload-zone ${form.image ? "has-image" : ""}`}>
            {form.image ? (
              <img
                src={form.image}
                alt="תצוגה מקדימה לתמונת האירוע"
                style={{ objectFit: form.image_mode as "cover" | "contain" }}
              />
            ) : (
              <>
                <ImagePlus size={36} />
                <strong>התמונה שמספרת את החוויה</strong>
                <span>לחצי להעלאת תמונה או פלייר מהטלפון</span>
                <small>JPG, PNG, WebP · עד 10MB</small>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(e) => upload(e.target.files?.[0])}
            />
            {form.image && (
              <span className="upload-replace">
                <Upload size={16} /> החלפת תמונה
              </span>
            )}
            {uploading && (
              <span className="upload-overlay">
                <Loader2 className="spin" /> מעלה את התמונה…
              </span>
            )}
          </label>
          <label>
            איך להציג את התמונה?
            <select
              value={form.image_mode}
              onChange={(e) => set("image_mode", e.target.value)}
            >
              <option value="cover">תמונת אווירה — מילוי המסגרת</option>
              <option value="contain">פלייר — הצגת התמונה בשלמותה</option>
            </select>
          </label>
          <p className="field-hint">
            לפלייר עם טקסט בחרי הצגה בשלמותה, כדי ששום פרט לא ייחתך.
          </p>
          <label>
            שם האירוע
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="למשל: נשים נפגשות בכותל"
              minLength={2}
              maxLength={120}
              required
            />
          </label>
          <label>
            משפט קצר שעושה חשק
            <input
              value={form.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="מפגש של תפילה, חיבור וזמן לעצמך"
              maxLength={160}
            />
          </label>
          <label>
            סוג האירוע
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="תפילה • חיבור • ביחד"
              maxLength={60}
              required
            />
          </label>
        </fieldset>
        <fieldset
          className="editor-step editor-panel"
          data-step={1}
          hidden={step !== 1}
        >
          <div className="panel-title">
            <h2>מתי ואיפה נפגשות?</h2>
          </div>
          <label>
            תאריך ושעה · שעון ישראל
            <input
              type="datetime-local"
              dir="ltr"
              value={form.starts_at}
              onChange={(e) => set("starts_at", e.target.value)}
              required
            />
          </label>
          <p className="field-hint date-hint" aria-live="polite">
            {dateHint || "בחרי תאריך ושעה, ונציג אותם כאן בעברית."}
          </p>
          <label>
            שם המקום
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="למשל: הכותל המערבי"
              minLength={2}
              maxLength={160}
              required
            />
          </label>
          <label>
            כתובת לניווט
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="רחוב, מספר ועיר"
              maxLength={250}
            />
          </label>
          <label>
            קצת על מה שמחכה לנו
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="ספרי בכמה מילים על החוויה, מה כלול ומה כדאי לדעת."
              rows={4}
              maxLength={5000}
            />
          </label>
        </fieldset>
        <fieldset
          className="editor-step editor-panel"
          data-step={2}
          hidden={step !== 2}
        >
          <div className="panel-title">
            <h2>מכינות מקום לכולן</h2>
          </div>
          <label>
            עלות השתתפות בש״ח
            <input
              type="number"
              min={0}
              max={100000}
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
          </label>
          <p className="field-hint">0 = ללא עלות. התשלום ייעשה מחוץ לאתר.</p>
          <label>
            כמה מקומות יש?
            <input
              type="number"
              min={1}
              max={100000}
              step={1}
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              placeholder="השאירי ריק אם אין הגבלה"
            />
          </label>
          <p className="field-hint">
            כשהאירוע מלא, בקשות חדשות יצטרפו לרשימת ההמתנה. אישור ההשתתפות תמיד
            בידיים שלך.
          </p>
        </fieldset>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="editor-actions">
          {step > 0 && (
            <button
              type="button"
              className="button outline-button back-step"
              aria-label="לשלב הקודם"
              onClick={() => goTo(step - 1)}
            >
              <ArrowRight size={18} />
            </button>
          )}
          {step < steps.length - 1 ? (
            <>
              {event && saveButton}
              <button
                key="next"
                type="button"
                className="button gold-button"
                disabled={busy || uploading}
                onClick={nextStep}
              >
                הבא <ArrowLeft size={18} />
              </button>
            </>
          ) : (
            <>
              {saveButton}
              <button
                key="preview"
                type="submit"
                className="button gold-button"
                disabled={busy || uploading}
              >
                <Eye size={18} /> תצוגה מקדימה
              </button>
            </>
          )}
        </div>
      </form>
      {preview && (
        <Modal title="ככה האירוע שלך ייראה" onClose={() => setPreview(false)}>
          <div className="event-preview">
            {form.image && (
              <img
                src={form.image}
                alt={form.title}
                style={{ objectFit: form.image_mode as "cover" | "contain" }}
              />
            )}
            <span className="eyebrow">{form.category}</span>
            <h2>{form.title}</h2>
            <p>{form.subtitle}</p>
            <div className="preview-facts">
              {form.starts_at && (
                <span>
                  {dateLabel(fromLocalInput(form.starts_at))} ·{" "}
                  {timeLabel(fromLocalInput(form.starts_at))}
                </span>
              )}
              <span>{form.location}</span>
              <strong>{priceLabel(Number(form.price))}</strong>
            </div>
            <p className="detail-description">{form.description}</p>
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <button
            className="button gold-button full-width"
            disabled={busy || uploading}
            onClick={() => save("published")}
          >
            <Check size={18} />
            {busy ? "מפרסמת…" : "נראה מעולה, פרסום האירוע"}
          </button>
        </Modal>
      )}
    </main>
  );
}
