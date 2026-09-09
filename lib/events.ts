import { query, transaction } from "./db";
import type { KoralEvent, Registration, Ticket } from "./types";
import { ticketState } from "./tickets";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const phoneSchema = z
  .string()
  .transform((s) => {
    const n = s.replace(/[\s().-]/g, "");
    return n.startsWith("+972")
      ? `0${n.slice(4)}`
      : n.startsWith("972")
        ? `0${n.slice(3)}`
        : n;
  })
  .pipe(
    z
      .string()
      .regex(/^0(?:5\d{8}|[23489]\d{7})$/, "יש להזין מספר טלפון ישראלי תקין"),
  );
export const registrationSchema = z.object({
  name: z.string().trim().min(2, "יש להזין שם מלא").max(100),
  phone: phoneSchema,
  guests: z.coerce.number().int().min(1).max(10).default(1),
});
export const eventSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(160).default(""),
  description: z.string().trim().max(5000).default(""),
  starts_at: z.string().datetime({ offset: true }),
  location: z.string().trim().min(2).max(160),
  address: z.string().trim().max(250).default(""),
  price: z.number().min(0).max(100000),
  capacity: z.number().int().positive().max(100000).nullable(),
  image: z
    .string()
    .max(500)
    .refine(
      (v) =>
        v === "" ||
        /^\/api\/media\/[a-f0-9-]+\.webp$/.test(v) ||
        /^https:\/\/images\.unsplash\.com\/[\w?=&.%+-]+$/.test(v),
    ),
  image_mode: z.enum(["cover", "contain"]),
  image_wide: z
    .string()
    .max(500)
    .default("")
    .refine((v) => v === "" || /^\/api\/media\/[a-f0-9-]+\.webp$/.test(v)),
  state: z.enum(["draft", "published", "closed", "archived"]),
  category: z.string().trim().min(1).max(60),
  qr_enabled: z.boolean().default(false),
});
export const ticketTokenSchema = z.string().regex(/^[a-f0-9]{32}$/);
const newTicketToken = () => randomBytes(16).toString("hex");
const select = `SELECT e.*, (SELECT coalesce(sum(guests),0) FROM registrations r WHERE r.event_id=e.id AND status='approved') AS approved, (SELECT count(*) FROM registrations r WHERE r.event_id=e.id AND status='pending') AS pending, (SELECT count(*) FROM registrations r WHERE r.event_id=e.id AND status='waitlist') AS waitlist, (SELECT count(*) FROM registrations r WHERE r.event_id=e.id AND paid=true) AS paid FROM events e`;
function clean(e: KoralEvent): KoralEvent {
  return {
    ...e,
    price: Number(e.price),
    qr_enabled: Boolean(e.qr_enabled),
    starts_at: new Date(e.starts_at).toISOString(),
    created_at: new Date(e.created_at).toISOString(),
  };
}
export async function getEvents(admin = false) {
  const { rows } = await query<KoralEvent>(
    `${select} ${admin ? "" : "WHERE e.state IN ('published','closed') AND e.starts_at>strftime('%Y-%m-%dT%H:%M:%fZ','now')"} ORDER BY e.starts_at ASC`,
  );
  return rows.map(clean);
}
export async function getEvent(id: string, admin = false) {
  const { rows } = await query<KoralEvent>(
    `${select} WHERE e.id=$1 ${admin ? "" : "AND e.state IN ('published','closed')"}`,
    [id],
  );
  return rows[0] ? clean(rows[0]) : null;
}
export async function saveEvent(input: unknown, id?: string) {
  const e = eventSchema.parse(input);
  if (e.state === "published" && !e.image)
    throw new AppError("יש להוסיף תמונה לפני פרסום האירוע");
  e.starts_at = new Date(e.starts_at).toISOString();
  const keys = Object.keys(e);
  const values = Object.values(e);
  return transaction(async (sql) => {
    if (id) {
      const locked = await sql.query("SELECT id FROM events WHERE id=$1", [id]);
      if (!locked.rows.length) throw new AppError("האירוע לא נמצא", 404);
      const { rows } = await sql.query<{ n: number }>(
        "SELECT coalesce(sum(guests),0) AS n FROM registrations WHERE event_id=$1 AND status='approved'",
        [id],
      );
      if (e.capacity && e.capacity < rows[0].n)
        throw new AppError("המכסה קטנה ממספר המשתתפות המאושרות");
      await sql.query(
        `UPDATE events SET ${keys.map((k, i) => `${k}=$${i + 1}`).join(",")} WHERE id=$${keys.length + 1}`,
        [...values, id],
      );
      if (e.price === 0)
        await sql.query(
          "UPDATE registrations SET paid=false WHERE event_id=$1",
          [id],
        );
    } else {
      id = randomUUID();
      await sql.query(
        `INSERT INTO events(id,${keys.join(",")}) VALUES($1,${keys.map((_, i) => `$${i + 2}`).join(",")})`,
        [id, ...values],
      );
    }
    return id;
  });
}
export async function register(eventId: string, input: unknown, admin = false) {
  const data = registrationSchema.parse(input);
  return transaction(async (sql) => {
    const { rows } = await sql.query<KoralEvent>(
      "SELECT * FROM events WHERE id=$1",
      [eventId],
    );
    const e = rows[0];
    if (
      !e ||
      (!admin &&
        (e.state !== "published" || new Date(e.starts_at) <= new Date()))
    )
      throw new AppError("ההרשמה לאירוע אינה פתוחה כרגע");
    const counts = await sql.query<{ n: number }>(
      "SELECT coalesce(sum(guests),0) AS n FROM registrations WHERE event_id=$1 AND status='approved'",
      [eventId],
    );
    const status =
      e.capacity && counts.rows[0].n + data.guests > e.capacity
        ? "waitlist"
        : "pending";
    const result = await sql.query(
      "INSERT INTO registrations(id,event_id,name,phone,status,guests,ticket_token) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(event_id,phone) DO NOTHING RETURNING id",
      [
        randomUUID(),
        eventId,
        data.name,
        data.phone,
        status,
        data.guests,
        newTicketToken(),
      ],
    );
    if (admin && !result.rows.length)
      throw new AppError("המספר כבר מופיע ברשימת האירוע");
    return { status }; // Same public response for duplicates, never disclose existing registration.
  });
}
export const updateRegistrationSchema = registrationSchema.extend({
  status: z.enum(["pending", "approved", "waitlist", "cancelled"]),
  paid: z.boolean(),
});
export async function updateRegistration(
  eventId: string,
  id: string,
  input: unknown,
) {
  const data = updateRegistrationSchema.parse(input);
  return transaction(async (sql) => {
    const { rows } = await sql.query<KoralEvent>(
      "SELECT * FROM events WHERE id=$1",
      [eventId],
    );
    const event = rows[0];
    if (!event) throw new AppError("האירוע לא נמצא", 404);
    const current = await sql.query<Registration>(
      "SELECT * FROM registrations WHERE id=$1 AND event_id=$2",
      [id, eventId],
    );
    if (!current.rows.length) throw new AppError("ההרשמה לא נמצאה", 404);
    if (data.status === "approved" && event.capacity) {
      const count = await sql.query<{ n: number }>(
        "SELECT coalesce(sum(guests),0) AS n FROM registrations WHERE event_id=$1 AND status='approved' AND id<>$2",
        [eventId, id],
      );
      if (count.rows[0].n + data.guests > event.capacity)
        throw new AppError(
          current.rows[0].status === "approved"
            ? "אין מספיק מקומות פנויים למספר המוזמנות הזה."
            : "האירוע מלא. יש לפנות מקום לפני האישור.",
        );
    }
    try {
      await sql.query(
        "UPDATE registrations SET name=$1,phone=$2,status=$3,paid=$4,guests=$5 WHERE id=$6 AND event_id=$7",
        [
          data.name,
          data.phone,
          data.status,
          Number(event.price) > 0 && data.paid,
          data.guests,
          id,
          eventId,
        ],
      );
    } catch (error) {
      if ((error as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE")
        throw new AppError("מספר הטלפון כבר רשום לאירוע");
      throw error;
    }
  });
}
export async function registrations(eventId: string) {
  const { rows } = await query<Registration>(
    "SELECT * FROM registrations WHERE event_id=$1 ORDER BY created_at DESC",
    [eventId],
  );
  return rows.map(cleanRegistration);
}
const cleanRegistration = (r: Registration): Registration => ({
  ...r,
  paid: Boolean(r.paid),
  checked_in_at: r.checked_in_at
    ? new Date(r.checked_in_at).toISOString()
    : null,
});
/** The ticket behind a secret link, or null when the link is not ours. */
export async function getTicket(token: unknown): Promise<Ticket | null> {
  const parsed = ticketTokenSchema.safeParse(token);
  if (!parsed.success) return null;
  const { rows } = await query<Registration>(
    "SELECT * FROM registrations WHERE ticket_token=$1",
    [parsed.data],
  );
  if (!rows[0]) return null;
  const event = await getEvent(rows[0].event_id, true);
  if (!event) return null;
  const registration = cleanRegistration(rows[0]);
  return { registration, event, state: ticketState(event, registration) };
}
/**
 * The door confirms she is in. Only an approved registration of an event
 * with QR entry can be checked in; the first check-in time is kept, so a
 * second scan shows "already inside" instead of quietly overwriting it.
 */
export async function setCheckedIn(token: unknown, checkedIn: boolean) {
  return transaction(async (sql) => {
    const parsed = ticketTokenSchema.safeParse(token);
    if (!parsed.success) throw new AppError("הכרטיס לא נמצא", 404);
    const { rows } = await sql.query<Registration>(
      "SELECT * FROM registrations WHERE ticket_token=$1",
      [parsed.data],
    );
    const current = rows[0];
    if (!current) throw new AppError("הכרטיס לא נמצא", 404);
    const events = await sql.query<KoralEvent>(
      "SELECT * FROM events WHERE id=$1",
      [current.event_id],
    );
    const event = events.rows[0];
    if (!event) throw new AppError("האירוע לא נמצא", 404);
    if (checkedIn) {
      const state = ticketState(
        { qr_enabled: Boolean(event.qr_enabled) },
        current,
      );
      if (state === "qr-off")
        throw new AppError(
          "כניסה עם QR כבויה לאירוע הזה. אפשר להדליק אותה בעריכת האירוע.",
        );
      if (state === "cancelled") throw new AppError("ההרשמה הזו בוטלה.");
      if (state === "not-approved")
        throw new AppError(
          "ההרשמה עוד לא אושרה. אפשר לאשר אותה ברשימת המשתתפות.",
        );
      if (state === "valid")
        await sql.query(
          "UPDATE registrations SET checked_in_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=$1 AND checked_in_at IS NULL",
          [current.id],
        );
    } else
      await sql.query(
        "UPDATE registrations SET checked_in_at=NULL WHERE id=$1",
        [current.id],
      );
    const updated = await sql.query<Registration>(
      "SELECT * FROM registrations WHERE id=$1",
      [current.id],
    );
    return {
      already: checkedIn && Boolean(current.checked_in_at),
      registration: cleanRegistration(updated.rows[0]),
    };
  });
}
export async function removeRegistration(eventId: string, id: string) {
  await query("DELETE FROM registrations WHERE id=$1 AND event_id=$2", [
    id,
    eventId,
  ]);
}
export async function rateLimit(key: string, limit: number, seconds: number) {
  await query(
    "DELETE FROM rate_limits WHERE expires_at<strftime('%Y-%m-%dT%H:%M:%fZ','now')",
  );
  const { rows } = await query<{ count: number }>(
    `INSERT INTO rate_limits(key,count,expires_at) VALUES($1,1,strftime('%Y-%m-%dT%H:%M:%fZ','now','+' || $2 || ' seconds')) ON CONFLICT(key) DO UPDATE SET count=rate_limits.count+1 RETURNING count`,
    [key, seconds],
  );
  if (rows[0].count > limit)
    throw new AppError("בוצעו יותר מדי ניסיונות. נסי שוב בעוד כמה דקות.", 429);
}
