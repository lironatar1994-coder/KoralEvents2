import { defineConfig } from "@playwright/test";
import fs from "node:fs";
if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 90000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.APP_ORIGIN || "http://localhost:3000",
    headless: true,
    launchOptions: {
      ...(process.platform === "win32"
        ? {
            executablePath:
              "C:/Program Files/Google/Chrome/Application/chrome.exe",
          }
        : {}),
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
