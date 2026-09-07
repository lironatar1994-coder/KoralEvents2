import Database from "better-sqlite3";
import fs from "node:fs/promises";
import path from "node:path";
const destination = process.argv[2];
if (!destination)
  throw Error("Usage: node scripts/backup.mjs /backups/koral.sqlite");
await fs.mkdir(path.dirname(destination), { recursive: true });
const db = new Database(process.env.DATABASE_PATH || "data/koral.sqlite", {
  readonly: true,
});
await db.backup(destination);
db.close();
console.log("Consistent SQLite backup completed.");
