import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { query } from "../lib/db";
import { getEvent, saveEvent } from "../lib/events";
import { demoEvents } from "../lib/demo-events";
if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");
async function main() {
  if (process.env.NODE_ENV === "production")
    throw Error("Demo update is local only");
  process.env.DATABASE_PATH = path.resolve("data/demo.sqlite");
  const old = [
    ["כשהלילה פוגש את הים", "שקיעה, מוזיקה ואנשים שעושים טוב על הלב."],
    ["עוד כוס, עוד סיפור", "ערב אינטימי של יין, טעמים וחיבורים חדשים."],
  ];
  const uploads = process.env.UPLOAD_DIR || "uploads";
  fs.mkdirSync(uploads, { recursive: true });
  for (let i = 0; i < demoEvents.length; i++) {
    const rows = await query<{ id: string }>(
      "SELECT id FROM events WHERE title=$1 AND subtitle=$2",
      old[i],
    );
    if (!rows.rows[0]) continue; // Do not overwrite a manager's renamed/edited event.
    const current = await getEvent(rows.rows[0].id, true);
    if (!current) continue;
    const name = `${randomUUID()}.webp`;
    fs.copyFileSync(demoEvents[i].asset, path.join(uploads, name));
    await saveEvent(
      { ...current, ...demoEvents[i], image: `/api/media/${name}` },
      current.id,
    );
  }
  await query(
    "UPDATE events SET state='archived' WHERE title=$1 AND subtitle=$2",
    ["הלילה שייך לנו", "משאירות את השבוע מאחור. נותנות למוזיקה להוביל."],
  );
  console.log(
    "Only original demo events updated; registration identities preserved.",
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
