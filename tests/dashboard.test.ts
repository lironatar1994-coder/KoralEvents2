import test from "node:test";
import assert from "node:assert/strict";
import { dashboardGroups } from "../lib/dashboard";
import type { KoralEvent } from "../lib/types";

test("dashboard approval queue includes only future, nonarchived, nondraft events with requests", () => {
  const now = Date.parse("2026-09-07T12:00:00Z");
  const event = (
    id: string,
    state: KoralEvent["state"],
    pending: number,
    past = false,
  ) =>
    ({
      id,
      state,
      pending,
      starts_at: past ? "2026-09-01T12:00:00Z" : "2026-10-01T12:00:00Z",
    }) as KoralEvent;
  const groups = dashboardGroups(
    [
      event("published", "published", 2),
      event("closed", "closed", 1),
      event("empty", "published", 0),
      event("draft", "draft", 3),
      event("archive", "archived", 4),
      event("past", "published", 1, true),
      event("old-draft", "draft", 0, true),
    ],
    now,
  );
  assert.deepEqual(
    groups.pending.map((e) => e.id),
    ["published", "closed"],
  );
  assert.deepEqual(
    groups.upcoming.map((e) => e.id),
    ["published", "closed", "empty"],
  );
  assert.deepEqual(
    groups.draft.map((e) => e.id),
    ["draft", "old-draft"],
  );
  assert.deepEqual(
    groups.archive.map((e) => e.id),
    ["archive", "past"],
  );
});

test("empty dashboard has no approval queue or spurious groups", () => {
  assert.deepEqual(dashboardGroups([]), {
    upcoming: [],
    draft: [],
    archive: [],
    pending: [],
  });
});
