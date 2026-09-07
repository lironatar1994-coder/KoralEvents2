import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { cookies } from "next/headers";
import { query } from "./db";
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function checkPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function bootstrapAdmin() {
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12)
    await query(
      "INSERT INTO admin(id,password_hash) VALUES(1,$1) ON CONFLICT(id) DO NOTHING",
      [hashPassword(process.env.ADMIN_PASSWORD)],
    );
}
export async function isAdmin() {
  const token = (await cookies()).get("koral_session")?.value;
  if (!token || token.length !== 64) return false;
  const { rows } = await query(
    "SELECT token_hash FROM sessions WHERE token_hash=$1 AND expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now')",
    [hashToken(token)],
  );
  return rows.length > 0;
}
export async function login(password: string) {
  await bootstrapAdmin();
  const { rows } = await query<{ password_hash: string }>(
    "SELECT password_hash FROM admin WHERE id=1",
  );
  if (!rows[0] || !checkPassword(password, rows[0].password_hash)) return false;
  const token = randomBytes(32).toString("hex");
  await query(
    "DELETE FROM sessions WHERE expires_at<strftime('%Y-%m-%dT%H:%M:%fZ','now')",
  );
  await query(
    "INSERT INTO sessions(token_hash,expires_at) VALUES($1,strftime('%Y-%m-%dT%H:%M:%fZ','now','+30 days'))",
    [hashToken(token)],
  );
  (await cookies()).set("koral_session", token, {
    httpOnly: true,
    secure:
      process.env.APP_ORIGIN?.startsWith("https://") ??
      process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 86400,
  });
  return true;
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get("koral_session")?.value;
  if (token)
    await query("DELETE FROM sessions WHERE token_hash=$1", [hashToken(token)]);
  jar.delete("koral_session");
}
