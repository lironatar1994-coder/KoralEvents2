import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
export interface Sql {
  query<T = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
}
type Store = { db?: Database.Database; queue: Promise<unknown> };
const globalDb = globalThis as unknown as { koralDb?: Store };
const store = (globalDb.koralDb ??= { queue: Promise.resolve() });
function database() {
  if (store.db) return store.db;
  const filename =
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), "data", "koral.sqlite");
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.exec(`
 CREATE TABLE IF NOT EXISTS admin(id INTEGER PRIMARY KEY CHECK(id=1), password_hash TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, expires_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS events(
 id TEXT PRIMARY KEY,title TEXT NOT NULL,subtitle TEXT NOT NULL DEFAULT '',description TEXT NOT NULL DEFAULT '',
 starts_at TEXT NOT NULL,location TEXT NOT NULL,address TEXT NOT NULL DEFAULT '',price REAL NOT NULL DEFAULT 0 CHECK(price>=0),
 capacity INTEGER CHECK(capacity>0),image TEXT NOT NULL DEFAULT '',image_mode TEXT NOT NULL DEFAULT 'cover' CHECK(image_mode IN ('cover','contain')),
 state TEXT NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','published','closed','archived')),category TEXT NOT NULL DEFAULT 'מפגש לנשים',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
 CREATE TABLE IF NOT EXISTS registrations(
 id TEXT PRIMARY KEY,event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,name TEXT NOT NULL,phone TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','waitlist','cancelled')),paid INTEGER NOT NULL DEFAULT 0 CHECK(paid IN(0,1)),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),UNIQUE(event_id,phone));
 CREATE INDEX IF NOT EXISTS registrations_event ON registrations(event_id,status);
 CREATE INDEX IF NOT EXISTS events_upcoming ON events(starts_at,state);
 CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at TEXT NOT NULL);
 `);
  // Schema v2: optional wide (desktop) image per event.
  const cols = db.prepare("PRAGMA table_info(events)").all() as {
    name: string;
  }[];
  if (!cols.some((c) => c.name === "image_wide"))
    db.exec(
      "ALTER TABLE events ADD COLUMN image_wide TEXT NOT NULL DEFAULT ''",
    );
  db.pragma("user_version = 2");
  store.db = db;
  return db;
}
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = store.queue.then(fn, fn);
  store.queue = next.catch(() => {});
  return next;
}
async function execute<T = Record<string, unknown>>(
  text: string,
  values: unknown[] = [],
): Promise<{ rows: T[] }> {
  const ordered: unknown[] = [];
  const sql = text.replace(/\$(\d+)/g, (_, n) => {
    const value = values[Number(n) - 1];
    ordered.push(typeof value === "boolean" ? Number(value) : value);
    return "?";
  });
  const stmt = database().prepare(sql);
  return {
    rows: stmt.reader
      ? (stmt.all(...ordered) as T[])
      : (stmt.run(...ordered), []),
  };
}
export function query<T = Record<string, unknown>>(
  text: string,
  values: unknown[] = [],
): Promise<{ rows: T[] }> {
  return serial(() => execute<T>(text, values));
}
export function transaction<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  return serial(async () => {
    const db = database();
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = await fn({ query: execute });
      db.exec("COMMIT");
      return result;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  });
}
