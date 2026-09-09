import type { KoralEvent } from "./types";

export function dashboardGroups(events: KoralEvent[], now = Date.now()) {
  const upcoming = events.filter(
    (e) =>
      e.state !== "archived" &&
      e.state !== "draft" &&
      new Date(e.starts_at).getTime() > now,
  );
  return {
    upcoming,
    draft: events.filter((e) => e.state === "draft"),
    archive: events.filter(
      (e) =>
        e.state === "archived" ||
        (e.state !== "draft" && new Date(e.starts_at).getTime() <= now),
    ),
    pending: upcoming
      .filter((e) => e.pending > 0)
      .sort((a, b) => b.pending - a.pending),
  };
}
