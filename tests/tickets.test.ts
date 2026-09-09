import test from "node:test";
import assert from "node:assert/strict";
import { ticketState, ticketCode, checkinUrl } from "../lib/tickets";
import { safeNext } from "../lib/auth";

test("ticket state follows the QR switch and the registration status", () => {
  const on = { qr_enabled: true };
  assert.equal(
    ticketState(
      { qr_enabled: false },
      { status: "approved", checked_in_at: null },
    ),
    "qr-off",
  );
  assert.equal(
    ticketState(on, { status: "pending", checked_in_at: null }),
    "not-approved",
  );
  assert.equal(
    ticketState(on, { status: "waitlist", checked_in_at: null }),
    "not-approved",
  );
  assert.equal(
    ticketState(on, { status: "cancelled", checked_in_at: null }),
    "cancelled",
  );
  assert.equal(
    ticketState(on, { status: "approved", checked_in_at: null }),
    "valid",
  );
  assert.equal(
    ticketState(on, {
      status: "approved",
      checked_in_at: "2026-09-09T18:00:00.000Z",
    }),
    "checked-in",
  );
});
test("the QR carries an absolute check-in link and a short readable code", () => {
  process.env.APP_ORIGIN = "https://example.test";
  const token = "0123456789abcdef0123456789abcdef";
  assert.equal(checkinUrl(token), `https://example.test/checkin/${token}`);
  assert.equal(ticketCode(token), "0123-4567");
});
test("login only returns to our own pages", () => {
  assert.equal(safeNext("/checkin/abc"), "/checkin/abc");
  assert.equal(safeNext("//evil.example"), "/admin");
  assert.equal(safeNext("https://evil.example"), "/admin");
  assert.equal(safeNext(undefined), "/admin");
});
