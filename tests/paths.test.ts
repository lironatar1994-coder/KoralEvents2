import test from "node:test";
import assert from "node:assert/strict";

test("production subpath prefixes API, media and share URLs exactly once", async () => {
  process.env.NEXT_PUBLIC_BASE_PATH = "/Koralevents2";
  const { appPath } = await import("../lib/paths");
  assert.equal(appPath("/api/auth/login"), "/Koralevents2/api/auth/login");
  assert.equal(appPath("/api/media/photo.webp"), "/Koralevents2/api/media/photo.webp");
  assert.equal(appPath("/events/123"), "/Koralevents2/events/123");
  assert.equal(appPath("/Koralevents2/api/media/photo.webp"), "/Koralevents2/api/media/photo.webp");
  assert.equal(appPath("https://example.com/photo.webp"), "https://example.com/photo.webp");
  assert.equal(appPath("blob:preview"), "blob:preview");
  assert.equal(appPath(""), "");
});
