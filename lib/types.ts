export type EventState = "draft" | "published" | "closed" | "archived";
export type RegistrationState =
  "pending" | "approved" | "waitlist" | "cancelled";
export interface KoralEvent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  starts_at: string;
  location: string;
  address: string;
  price: number;
  capacity: number | null;
  image: string;
  image_mode: "cover" | "contain";
  image_wide: string;
  state: EventState;
  category: string;
  qr_enabled: boolean;
  created_at: string;
  approved: number;
  pending: number;
  waitlist: number;
  paid: number;
}
export interface Registration {
  id: string;
  event_id: string;
  name: string;
  phone: string;
  status: RegistrationState;
  paid: boolean;
  guests: number;
  ticket_token: string;
  checked_in_at: string | null;
  created_at: string;
}
/** What the door sees when a ticket link is opened. */
export type TicketState =
  "valid" | "checked-in" | "not-approved" | "cancelled" | "qr-off";
export interface Ticket {
  registration: Registration;
  event: KoralEvent;
  state: TicketState;
}
export const ticketStateLabels: Record<TicketState, string> = {
  valid: "כרטיס תקין",
  "checked-in": "כבר נכנסה",
  "not-approved": "ההרשמה עוד לא אושרה",
  cancelled: "ההרשמה בוטלה",
  "qr-off": "כניסה עם QR כבויה לאירוע הזה",
};
export const statusLabels: Record<RegistrationState, string> = {
  pending: "ממתינה לאישור",
  approved: "מאושרת",
  waitlist: "רשימת המתנה",
  cancelled: "בוטלה",
};
export const eventStateLabels: Record<EventState, string> = {
  draft: "טיוטה",
  published: "הרשמה פתוחה",
  closed: "הרשמה סגורה",
  archived: "בארכיון",
};
export const dateLabel = (
  value: string,
  options?: Intl.DateTimeFormatOptions,
) => {
  const label = new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "long",
    ...options,
  }).format(new Date(value));
  return options?.weekday && isJerusalemSaturday(value)
    ? label.replace(/יום שבת|שבת/, "מוצאי שבת")
    : label;
};
export const isJerusalemSaturday = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    weekday: "short",
  }).format(new Date(value)) === "Sat";
export const weekdayLabel = (value: string) =>
  isJerusalemSaturday(value)
    ? "מוצאי שבת"
    : new Intl.DateTimeFormat("he-IL", {
        timeZone: "Asia/Jerusalem",
        weekday: "long",
      }).format(new Date(value));
export const timeLabel = (value: string) =>
  dateLabel(value, {
    day: undefined,
    month: undefined,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
export const priceLabel = (price: number) =>
  price > 0 ? `₪${price.toLocaleString("he-IL")}` : "ללא עלות";
