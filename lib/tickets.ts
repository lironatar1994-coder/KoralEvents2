import { appPath } from "./paths";
import type { KoralEvent, Registration, Ticket, TicketState } from "./types";

/* Absolute links, because they travel: one in a WhatsApp message, one inside the QR. */
export const publicOrigin = () =>
  process.env.APP_ORIGIN || "http://localhost:3000";
export const ticketPath = (token: string) => appPath(`/tickets/${token}`);
export const checkinPath = (token: string) => appPath(`/checkin/${token}`);
export const checkinUrl = (token: string) =>
  `${publicOrigin()}${checkinPath(token)}`;
/* Short, human code printed under the QR so the door can also read it aloud. */
export const ticketCode = (token: string) =>
  `${token.slice(0, 4)}-${token.slice(4, 8)}`.toUpperCase();
export const ticketReady = (ticket: Ticket) =>
  ticket.state === "valid" || ticket.state === "checked-in";
export function ticketState(
  event: Pick<KoralEvent, "qr_enabled">,
  registration: Pick<Registration, "status" | "checked_in_at">,
): TicketState {
  if (!event.qr_enabled) return "qr-off";
  if (registration.status === "cancelled") return "cancelled";
  if (registration.status !== "approved") return "not-approved";
  return registration.checked_in_at ? "checked-in" : "valid";
}
