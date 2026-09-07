// Run inside the container: docker compose exec -e NEW_ADMIN_PASSWORD app node scripts/rotate-password.mjs
// Export NEW_ADMIN_PASSWORD in the invoking shell first; never put the password in command history.
import Database from "better-sqlite3";
import { randomBytes, scryptSync } from "node:crypto";
const password = process.env.NEW_ADMIN_PASSWORD;
if (!password || password.length < 12)
  throw Error("NEW_ADMIN_PASSWORD must contain at least 12 characters.");
const salt = randomBytes(16).toString("hex");
const hash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const db = new Database(process.env.DATABASE_PATH || "data/koral.sqlite");
db.transaction(() => {
  db.prepare(
    "INSERT INTO admin(id,password_hash) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash",
  ).run(hash);
  db.prepare("DELETE FROM sessions").run();
})();
db.close();
console.log("Password updated and sessions revoked.");
