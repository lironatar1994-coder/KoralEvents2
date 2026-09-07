import test from "node:test";
import assert from "node:assert/strict";

test("production subpath prefixes API, media and share URLs exactly once", async () => {
  process.env.NEXT_PUBLIC_BASE_PATH = "/koralevents";
  const { appPath } = await import("../lib/paths");
  assert.equal(appPath("/api/auth/login"), "/koralevents/api/auth/login");
  assert.equal(appPath("/api/media/photo.webp"), "/koralevents/api/media/photo.webp");
  assert.equal(appPath("/events/123"), "/koralevents/events/123");
  assert.equal(appPath("/koralevents/api/media/photo.webp"), "/koralevents/api/media/photo.webp");
  assert.equal(appPath("https://example.com/photo.webp"), "https://example.com/photo.webp");
  assert.equal(appPath("blob:preview"), "blob:preview");
  assert.equal(appPath(""), "");
});
