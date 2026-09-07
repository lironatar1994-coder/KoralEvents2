import fs from "node:fs";
import { query, transaction } from "../lib/db";
import { hashPassword } from "../lib/auth";
if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");
async function main() {
  const password = process.env.NEW_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12)
    throw Error("Set NEW_ADMIN_PASSWORD to at least 12 characters.");
  await transaction(async (sql) => {
    await sql.query(
      "INSERT INTO admin(id,password_hash) VALUES(1,$1) ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash",
      [hashPassword(password)],
    );
    await sql.query("DELETE FROM sessions");
  });
  console.log("Administrator password updated. All previous sessions revoked.");
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
