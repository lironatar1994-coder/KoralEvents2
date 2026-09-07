import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import { demoEvents } from "../lib/demo-events";
import {
  saveEvent,
  register,
  registrations,
  updateRegistration,
} from "../lib/events";
if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");
async function main() {
  if (process.env.NODE_ENV === "production")
    throw Error("Demo seeding is disabled in production.");
  process.env.DATABASE_PATH = path.resolve("data/demo.sqlite");
  const existing = await query<{ n: number }>(
    "SELECT count(*) AS n FROM events",
  );
  if (existing.rows[0].n) {
    console.log("Demo data already exists; no changes made.");
    return;
  }
  const definitions = demoEvents;
  for (const def of definitions) {
    const uploadDir = process.env.UPLOAD_DIR || "uploads";
    fs.mkdirSync(uploadDir, { recursive: true });
    const source = fs.readFileSync(def.asset);
    const filename = `${randomUUID()}.webp`;
    await sharp(source)
      .resize({ width: 1800, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(uploadDir, filename));
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + def.days);
    date.setUTCHours(16, 30, 0, 0);
    const id = await saveEvent({
      ...def,
      image: `/api/media/${filename}`,
      image_mode: "cover",
      starts_at: date.toISOString(),
      state: "published",
    });
    const people = [
      "נועה לדוגמה",
      "מאיה לדוגמה",
      "דנה לדוגמה",
      "שירה לדוגמה",
      "יעל לדוגמה",
    ];
    for (let i = 0; i < people.length; i++) {
      await register(id, { name: people[i], phone: `050000000${i}` }, true);
    }
    const rows = await registrations(id);
    for (let i = 0; i < 3; i++)
      await updateRegistration(id, rows[i].id, {
        ...rows[i],
        status: "approved",
        paid: i < 2,
      });
  }
  console.log(
    "Demo created in data/demo.sqlite only. Fictional events and participants; do not use as live data.",
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
