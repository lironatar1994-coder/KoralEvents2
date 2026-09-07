import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");
process.env.DATABASE_PATH = path.resolve(
  process.env.DATABASE_PATH || "data/koral.sqlite",
);
process.env.UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");
process.env.HOSTNAME = "0.0.0.0";
fs.cpSync("public", ".next/standalone/public", { recursive: true });
fs.cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
await import(pathToFileURL(path.resolve(".next/standalone/server.js")).href);
