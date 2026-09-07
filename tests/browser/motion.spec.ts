import { test, expect } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  for (const status of ["pending", "waitlist"]) {
    test(`mobile confirmation: ${status}, motion ${reducedMotion}`, async ({
      page,
    }) => {
      test.skip(
        !process.env.DATABASE_PATH?.endsWith("demo.sqlite"),
        "Local demo only",
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion });
      await page.goto("/");
      if (reducedMotion === "reduce") {
        await expect(page.locator(".hero-line > span").first()).toHaveCSS(
          "transform",
          "none",
        );
      }
      await page.locator(".event-card").first().click();
      await expect(
        page.locator(".registration-box form > button"),
      ).toBeEnabled();
      // Exercise both server outcomes without creating registrations.
      await page.route("**/api/events/*/register", (route) =>
        route.fulfill({
          json: { status },
        }),
      );
      await page.locator('input[name="name"]').fill("בדיקת הנפשה");
      await page.locator('input[name="phone"]').fill("0501234567");
      await page
        .locator(".registration-box button[type=button]")
        .last()
        .click();
      await expect(page.locator(".stepper output")).toHaveText("2");
      await page.locator(".registration-box form > button").click();
      const confirmation = page.locator(".registration-success");
      await expect(confirmation).toBeVisible();
      await expect(confirmation.locator("h3")).toHaveCSS(
        "animation-name",
        "none",
      );
      await expect(confirmation.locator(".success-actions")).toHaveCSS(
        "opacity",
        "1",
      );
      if (status === "waitlist") {
        await expect(confirmation.locator("h3")).toHaveText(
          "את ברשימת ההמתנה.",
        );
        await expect(confirmation.locator(".is-waitlist")).toBeVisible();
        await expect(confirmation.locator(".success-mark")).toHaveCount(0);
      } else {
        await expect(confirmation.locator("h3")).toHaveText("הבקשה שלך נשלחה.");
        await expect(confirmation.locator("p")).toContainText(
          "המקום עדיין לא מאושר",
        );
        if (reducedMotion === "reduce") {
          await expect(confirmation.locator(".success-check")).toHaveCSS(
            "stroke-dashoffset",
            "0px",
          );
          await expect(confirmation.locator(".success-check")).toHaveCSS(
            "animation-name",
            "none",
          );
        }
      }
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: `test-results/confirmation-${status}-${reducedMotion}.png`,
        fullPage: false,
        animations: "disabled",
      });
    });
  }
}
