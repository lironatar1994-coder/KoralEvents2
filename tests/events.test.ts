import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  saveEvent,
  register,
  registrations,
  updateRegistration,
  getEvent,
  getEvents,
  removeRegistration,
  rateLimit,
  phoneSchema,
} from "../lib/events";
import { query } from "../lib/db";
import { hashPassword, checkPassword } from "../lib/auth";
import { fromLocalInput, toLocalInput } from "../lib/client";
process.env.DATABASE_PATH = path.join(
  mkdtempSync(path.join(os.tmpdir(), "koral-tests-")),
  "test.sqlite",
);
const base = {
  title: "אירוע בדיקה",
  subtitle: "ערב מיוחד",
  description: "תיאור לדוגמה",
  starts_at: new Date(Date.now() + 86400000 * 10).toISOString(),
  location: "תל אביב",
  address: "נמל יפו",
  price: 80,
  capacity: 1,
  image: "/api/media/11111111-1111-1111-1111-111111111111.webp",
  image_mode: "cover",
  state: "published",
  category: "מוזיקה",
};
const person = (n: number) => ({
  name: `משתתפת ${n}`,
  phone: `05012345${n.toString().padStart(2, "0")}`,
});
test("phone normalization accepts local and international format", () => {
  assert.equal(phoneSchema.parse("+972 50-123-4567"), "0501234567");
  assert.throws(() => phoneSchema.parse("abc"));
});
test("publishing requires an image while a draft can be saved without one", async () => {
  await assert.rejects(saveEvent({ ...base, image: "" }));
  const id = await saveEvent({ ...base, image: "", state: "draft" });
  assert.equal((await getEvent(id, true))!.state, "draft");
});
test("registration starts pending and duplicate does not modify identity or status", async () => {
  const id = await saveEvent(base);
  const response = await register(id, person(1));
  assert.equal(response.status, "pending");
  assert.deepEqual(
    await register(id, { name: "שם אחר", phone: "+972501234501" }),
    response,
  );
  const rows = await registrations(id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, person(1).name);
});
test("concurrent approvals cannot exceed capacity; waitlist is explicit and never auto-promoted", async () => {
  const id = await saveEvent(base);
  await Promise.all([register(id, person(2)), register(id, person(3))]);
  let rows = await registrations(id);
  const results = await Promise.allSettled(
    rows.map((r) => updateRegistration(id, r.id, { ...r, status: "approved" })),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await getEvent(id, true))!.approved, 1);
  assert.equal((await register(id, person(4))).status, "waitlist");
  rows = await registrations(id);
  const approved = rows.find((r) => r.status === "approved")!;
  await updateRegistration(id, approved.id, {
    ...approved,
    status: "cancelled",
  });
  assert.equal((await getEvent(id, true))!.approved, 0);
  assert.equal(
    (await registrations(id)).find((r) => r.phone === person(4).phone)!.status,
    "waitlist",
  );
});
test("capacity reduction below approved seats is rejected", async () => {
  const id = await saveEvent({ ...base, capacity: 2 });
  for (const n of [5, 6]) await register(id, person(n));
  for (const r of await registrations(id))
    await updateRegistration(id, r.id, { ...r, status: "approved" });
  await assert.rejects(saveEvent({ ...base, capacity: 1 }, id));
  assert.equal((await getEvent(id, true))!.capacity, 2);
});
test("payment is separate from approval and cancellation, free events cannot be marked paid", async () => {
  const id = await saveEvent(base);
  await register(id, person(7));
  const r = (await registrations(id))[0];
  await updateRegistration(id, r.id, { ...r, status: "approved", paid: true });
  let updated = (await registrations(id))[0];
  assert.equal(updated.paid, true);
  await updateRegistration(id, r.id, { ...updated, status: "cancelled" });
  assert.equal((await registrations(id))[0].paid, true);
  await saveEvent({ ...base, price: 0 }, id);
  updated = (await registrations(id))[0];
  assert.equal(updated.paid, false);
  await updateRegistration(id, r.id, { ...updated, paid: true });
  assert.equal((await registrations(id))[0].paid, false);
});
test("admin detects duplicate entries; a registration cannot be edited through another event", async () => {
  const id = await saveEvent(base),
    other = await saveEvent(base);
  await register(id, person(8), true);
  await assert.rejects(register(id, person(8), true));
  const r = (await registrations(id))[0];
  await assert.rejects(
    updateRegistration(other, r.id, { ...r, status: "approved" }),
  );
  assert.equal((await registrations(id))[0].status, "pending");
});
test("duplicate phone edits fail without losing original details", async () => {
  const id = await saveEvent(base);
  await register(id, person(9));
  await register(id, person(10));
  const rows = await registrations(id);
  await assert.rejects(
    updateRegistration(id, rows[0].id, { ...rows[0], phone: rows[1].phone }),
  );
  assert.equal((await registrations(id)).length, 2);
});
test("draft/archived events are private; closed and past events cannot register", async () => {
  for (const state of ["draft", "archived", "closed"]) {
    const id = await saveEvent({ ...base, state });
    await assert.rejects(register(id, person(11)));
    if (state !== "closed") assert.equal(await getEvent(id), null);
  }
  const id = await saveEvent({
    ...base,
    starts_at: "2020-01-01T18:00:00.000Z",
  });
  await assert.rejects(register(id, person(12)));
  assert.equal(
    (await getEvents()).some((e) => e.id === id),
    false,
  );
});
test("permanent removal is scoped to event", async () => {
  const id = await saveEvent(base),
    other = await saveEvent(base);
  await register(id, person(13));
  const r = (await registrations(id))[0];
  await removeRegistration(other, r.id);
  assert.equal((await registrations(id)).length, 1);
  await removeRegistration(id, r.id);
  assert.equal((await registrations(id)).length, 0);
});
test("unlimited event stays pending regardless of approved participants", async () => {
  const id = await saveEvent({ ...base, capacity: null });
  await register(id, person(14));
  const r = (await registrations(id))[0];
  await updateRegistration(id, r.id, { ...r, status: "approved" });
  assert.equal((await register(id, person(15))).status, "pending");
});
test("rate limiting persists in the database and expires", async () => {
  await rateLimit("test", 2, 600);
  await rateLimit("test", 2, 600);
  await assert.rejects(rateLimit("test", 2, 600));
  await query(
    "UPDATE rate_limits SET expires_at='2000-01-01' WHERE key='test'",
  );
  await rateLimit("test", 2, 600);
});
test("passwords are salted and verified", () => {
  const a = hashPassword("long-test-password"),
    b = hashPassword("long-test-password");
  assert.notEqual(a, b);
  assert.equal(checkPassword("long-test-password", a), true);
  assert.equal(checkPassword("incorrect", a), false);
});
test("Israel time conversion handles summer/winter and rejects nonexistent spring time", () => {
  assert.equal(fromLocalInput("2026-09-20T19:30"), "2026-09-20T16:30:00.000Z");
  assert.equal(fromLocalInput("2026-12-20T19:30"), "2026-12-20T17:30:00.000Z");
  assert.equal(toLocalInput("2026-09-20T16:30:00.000Z"), "2026-09-20T19:30");
  assert.throws(() => fromLocalInput("2026-03-27T02:30"));
});
test("data survives a separate process connection", async () => {
  const id = await saveEvent(base);
  const output = execFileSync(
    process.execPath,
    [
      "-e",
      "const DB=require('better-sqlite3');const d=new DB(process.env.DATABASE_PATH);console.log(d.prepare('SELECT id FROM events WHERE id=?').get(process.argv[1]).id);d.close();",
      id,
    ],
    { encoding: "utf8" },
  );
  assert.equal(output.trim(), id);
});

test("guests count as seats: a party larger than the free seats goes to the waitlist", async () => {
  const id = await saveEvent({ ...base, capacity: 4 });
  await register(id, { ...person(1), guests: 3 });
  const [three] = await registrations(id);
  await updateRegistration(id, three.id, { ...three, status: "approved" });
  assert.equal((await getEvent(id, true))!.approved, 3);
  assert.equal(
    (await register(id, { ...person(2), guests: 2 })).status,
    "waitlist",
  );
  assert.equal(
    (await register(id, { ...person(3), guests: 1 })).status,
    "pending",
  );
  const single = (await registrations(id)).find(
    (r) => r.phone === person(3).phone,
  )!;
  await updateRegistration(id, single.id, { ...single, status: "approved" });
  assert.equal((await getEvent(id, true))!.approved, 4);
  await assert.rejects(
    updateRegistration(id, single.id, {
      ...single,
      status: "approved",
      guests: 2,
    }),
  );
});
test("every registration carries a unique secret ticket token", async () => {
  const id = await saveEvent({ ...base, capacity: null });
  await register(id, person(60));
  await register(id, person(61));
  const rows = await registrations(id);
  assert.equal(rows.length, 2);
  for (const r of rows) assert.match(r.ticket_token, /^[a-f0-9]{32}$/);
  assert.notEqual(rows[0].ticket_token, rows[1].ticket_token);
  assert.equal(rows[0].checked_in_at, null);
});
test("a ticket is valid only when QR entry is on and the registration is approved", async () => {
  const { getTicket, setCheckedIn } = await import("../lib/events");
  const id = await saveEvent({ ...base, capacity: null });
  assert.equal((await getEvent(id, true))!.qr_enabled, false);
  await register(id, person(62));
  const [row] = await registrations(id);
  assert.equal(await getTicket("not-a-token"), null);
  assert.equal(await getTicket("0".repeat(32)), null);
  assert.equal((await getTicket(row.ticket_token))!.state, "qr-off");
  await assert.rejects(setCheckedIn(row.ticket_token, true), /QR/);
  await saveEvent({ ...base, capacity: null, qr_enabled: true }, id);
  assert.equal((await getEvent(id, true))!.qr_enabled, true);
  assert.equal((await getTicket(row.ticket_token))!.state, "not-approved");
  await assert.rejects(setCheckedIn(row.ticket_token, true), /אושרה/);
  await updateRegistration(id, row.id, { ...row, status: "approved" });
  const ticket = (await getTicket(row.ticket_token))!;
  assert.equal(ticket.state, "valid");
  assert.equal(ticket.event.id, id);
  assert.equal(ticket.registration.name, person(62).name);
});
test("check-in keeps the first time, flags a second scan, and can be undone", async () => {
  const { getTicket, setCheckedIn } = await import("../lib/events");
  const id = await saveEvent({ ...base, capacity: null, qr_enabled: true });
  await register(id, person(63));
  const [row] = await registrations(id);
  await updateRegistration(id, row.id, { ...row, status: "approved" });
  const first = await setCheckedIn(row.ticket_token, true);
  assert.equal(first.already, false);
  assert.ok(first.registration.checked_in_at);
  assert.equal((await getTicket(row.ticket_token))!.state, "checked-in");
  const second = await setCheckedIn(row.ticket_token, true);
  assert.equal(second.already, true);
  assert.equal(
    second.registration.checked_in_at,
    first.registration.checked_in_at,
  );
  const undone = await setCheckedIn(row.ticket_token, false);
  assert.equal(undone.registration.checked_in_at, null);
  assert.equal((await getTicket(row.ticket_token))!.state, "valid");
  await updateRegistration(id, row.id, { ...row, status: "cancelled" });
  assert.equal((await getTicket(row.ticket_token))!.state, "cancelled");
  await assert.rejects(setCheckedIn(row.ticket_token, true), /בוטלה/);
});
