import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";

test.beforeAll(() => {
  if (!process.env.DATABASE_PATH?.endsWith("demo.sqlite"))
    throw Error(
      "Browser tests must run against local demo.sqlite, never live data.",
    );
});

test("public site is readable, accessible, and has no overflow at phone and desktop widths", async ({
  page,
}) => {
  for (const width of [360, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("h1")).toContainText("אישה לאישה");
    await expect(page.locator("h1")).toContainText("מלכה");
    await expect
      .poll(() =>
        page
          .locator(".hero-slide.is-active img")
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await expect(page.locator(".skip-link")).toHaveCSS("opacity", "1");
});

test("private API and management pages require authentication and reject foreign origins", async ({
  request,
  page,
}) => {
  expect((await request.get("/api/admin/events")).status()).toBe(401);
  expect(
    (
      await request.post("/api/admin/events", {
        headers: { Origin: "https://untrusted.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/admin/upload", {
        headers: { Origin: process.env.APP_ORIGIN! },
      })
    ).status(),
  ).toBe(401);
  await page.goto("/admin/events/new");
  await expect(page).toHaveURL(/admin\/login/);
});

test("manager creates a flyer event, approves requests, handles capacity and payments, and archives", async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/login");
  await page.getByLabel("הסיסמה שלך").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "כניסה לניהול" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const session = (await page.context().cookies()).find(
    (c) => c.name === "koral_session",
  );
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
  expect(session!.expires).toBeGreaterThan(Date.now() / 1000 + 29 * 86400);
  const resumed = await browser.newContext({
    storageState: await page.context().storageState(),
    baseURL: process.env.APP_ORIGIN,
  });
  const resumedPage = await resumed.newPage();
  await resumedPage.goto("/admin");
  await expect(resumedPage).toHaveURL(/\/admin$/);
  await resumed.close();
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
  });
  const adminAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(adminAxe.violations).toEqual([]);
  await page.getByRole("link", { name: "יצירת אירוע", exact: true }).click();
  const png = await sharp({
    create: { width: 600, height: 1000, channels: 3, background: "#564637" },
  })
    .png()
    .toBuffer();
  await page.locator("input[type=file]").first().setInputFiles({
    name: "test-flyer.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByAltText("תצוגה מקדימה לתמונת האירוע")).toBeVisible();
  await page.getByLabel("איך להציג את התמונה?").selectOption("contain");
  await page.getByLabel("שם האירוע", { exact: true }).fill("אירוע בדיקת דפדפן");
  await page.getByLabel("משפט קצר שעושה חשק").fill("בדיקה אוטומטית בלבד");
  await page.getByRole("button", { name: "הבא" }).click();
  const next = new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10);
  await page.getByLabel("תאריך ושעה").fill(`${next}T20:30`);
  await expect(page.locator(".date-hint")).toContainText("20:30");
  await page.getByLabel("שם המקום").fill("מקום בדיקה");
  await page
    .getByLabel("קצת על מה שמחכה לנו")
    .fill("פלייר מלא, אישורים ורשימת המתנה.");
  await page.getByRole("button", { name: "הבא" }).click();
  await page.getByLabel("עלות השתתפות").fill("50");
  await page.getByLabel("כמה מקומות יש?").fill("1");
  await page.screenshot({
    path: "test-results/editor-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "תצוגה מקדימה", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "נראה מעולה, פרסום האירוע" }).click();
  await expect(page).toHaveURL(/\/admin\/events\/[a-f0-9-]{36}$/);
  const id = page.url().split("/").pop()!;
  const endpoint = `/api/admin/events/${id}`;
  const guest = await browser.newContext({
    viewport: { width: 390, height: 844 },
    baseURL: process.env.APP_ORIGIN,
  });
  const visitor = await guest.newPage();
  await visitor.goto(`/events/${id}`);
  await expect(visitor.locator(".detail-visual img")).toHaveCSS(
    "object-fit",
    "contain",
  );
  const bounds = await visitor.locator(".detail-visual img").boundingBox();
  expect(bounds!.height / bounds!.width).toBeCloseTo(1000 / 600, 1);
  await visitor.screenshot({
    path: "test-results/event-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  const eventAxe = await new AxeBuilder({ page: visitor })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(eventAxe.violations).toEqual([]);
  await visitor.getByLabel("השם המלא שלך").fill("משתתפת בדיקה");
  await visitor.getByLabel("מספר הטלפון").fill("0509999901");
  await visitor.getByRole("button", { name: "אני באה" }).click();
  await expect(visitor.getByRole("status")).toContainText(
    "המקום עדיין לא מאושר",
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "אישור השתתפות" }).click();
  await expect(page.locator(".attendee-card .status-approved")).toBeVisible();
  const wa = page.getByRole("link", { name: "שליחת אישור בוואטסאפ" });
  await expect(wa).toHaveAttribute(
    "href",
    /^https:\/\/wa.me\/972509999901\?text=/,
  ); // Verify target only; never send a message.
  await page.getByRole("button", { name: /לא שולם, לחצי לסימון שולם/ }).click();
  await expect(page.locator(".payment-toggle")).toContainText("שולם");
  await visitor.reload();
  await visitor.getByLabel("השם המלא שלך").fill("משתתפת בהמתנה");
  await visitor.getByLabel("מספר הטלפון").fill("0509999902");
  await visitor.getByRole("button", { name: "שמרי לי מקום בהמתנה" }).click();
  await expect(visitor.getByRole("status")).toContainText("רשימת ההמתנה");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "אישור השתתפות" }).click();
  await expect(page.locator(".error-message")).toContainText("האירוע מלא");
  await page.getByRole("button", { name: "הוספת משתתפת" }).click();
  await page.getByRole("dialog").getByLabel("שם מלא").fill("נוספה ידנית");
  await page.getByRole("dialog").getByLabel("מספר טלפון").fill("0509999903");
  await page.getByRole("button", { name: "שמירת פרטים" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "נוספה ידנית" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: "test-results/participants-mobile.png",
    fullPage: true,
  });
  const rows = await (
    await page.request.get(`${endpoint}/registrations`)
  ).json();
  const approved = rows.find(
    (r: { status: string }) => r.status === "approved",
  );
  const headers = { Origin: process.env.APP_ORIGIN! };
  const cancelled = await page.request.patch(
    `${endpoint}/registrations/${approved.id}`,
    { headers, data: { ...approved, status: "cancelled" } },
  );
  expect(cancelled.ok()).toBe(true);
  const event = await (await page.request.get(endpoint)).json();
  expect(event.approved).toBe(0);
  expect(event.waitlist).toBe(2);
  const invalid = await page.request.post("/api/admin/upload", {
    headers,
    multipart: {
      file: {
        name: "bad.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from("<svg/>"),
      },
    },
  });
  expect(invalid.status()).toBe(400);
  const disguised = await page.request.post("/api/admin/upload", {
    headers,
    multipart: {
      file: {
        name: "disguised.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2"/></svg>',
        ),
      },
    },
  });
  expect(disguised.status()).toBe(400);
  await page.request.patch(endpoint, {
    headers,
    data: { ...event, state: "archived" },
  });
  await visitor.goto(`/events/${id}`);
  await expect(
    visitor.getByRole("heading", { name: "הרגע הזה לא נמצא." }),
  ).toBeVisible();
  await guest.close();
});
