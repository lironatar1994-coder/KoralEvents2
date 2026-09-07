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
  created_at: string;
}
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
) =>
  new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "long",
    ...options,
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
