// Re-copies the demo assets for the demo events into uploads and points the
// events at the fresh files. Local demo database only; never touches live data.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import { getEvent, saveEvent } from "../lib/events";
import { demoEvents } from "../lib/demo-events";
if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");
async function main() {
  if (process.env.NODE_ENV === "production")
    throw Error("Demo refresh is local only");
  process.env.DATABASE_PATH = path.resolve("data/demo.sqlite");
  const uploads = process.env.UPLOAD_DIR || "uploads";
  fs.mkdirSync(uploads, { recursive: true });
  const only = process.argv.slice(2);
  for (const def of demoEvents) {
    if (only.length && !only.includes(def.title)) continue;
    const rows = await query<{ id: string }>(
      "SELECT id FROM events WHERE title=$1",
      [def.title],
    );
    if (!rows.rows[0]) continue;
    const current = await getEvent(rows.rows[0].id, true);
    if (!current) continue;
    const name = `${randomUUID()}.webp`;
    await sharp(fs.readFileSync(def.asset))
      .resize({ width: 1800, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(uploads, name));
    let image_wide = current.image_wide || "";
    if (def.assetWide) {
      const wideName = `${randomUUID()}.webp`;
      await sharp(fs.readFileSync(def.assetWide))
        .resize({ width: 2000, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(path.join(uploads, wideName));
      image_wide = `/api/media/${wideName}`;
    }
    await saveEvent(
      { ...current, image: `/api/media/${name}`, image_wide },
      current.id,
    );
    console.log("refreshed image:", def.title);
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
