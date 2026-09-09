import assert from "node:assert/strict";
import test from "node:test";
import { dateLabel, weekdayLabel } from "../lib/types";

test("Saturday events are presented as Motzaei Shabbat", () => {
  const saturdayEvening = "2026-09-19T16:30:00.000Z";

  assert.equal(weekdayLabel(saturdayEvening), "מוצאי שבת");
  assert.match(
    dateLabel(saturdayEvening, { weekday: "long" }),
    /מוצאי שבת/,
  );
  assert.doesNotMatch(
    dateLabel(saturdayEvening, { weekday: "long" }),
    /יום שבת/,
  );
});

test("other weekdays keep their regular Hebrew label", () => {
  const fridayEvening = "2026-09-18T16:30:00.000Z";

  assert.equal(weekdayLabel(fridayEvening), "יום שישי");
});
