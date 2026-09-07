import { NextRequest, NextResponse } from "next/server";
import { isAdmin, login, logout, hashToken } from "@/lib/auth";
import {
  AppError,
  getEvent,
  getEvents,
  register,
  registrations,
  removeRegistration,
  saveEvent,
  updateRegistration,
  rateLimit,
} from "@/lib/events";
import { ZodError } from "zod";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const uploadDir = () =>
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
async function body(req: NextRequest, max: number) {
  const reader = req.body?.getReader();
  if (!reader) throw new AppError("הבקשה ריקה");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new AppError("הקובץ גדול מדי", 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
async function json(req: NextRequest) {
  try {
    return JSON.parse((await body(req, 32000)).toString());
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("נתונים לא תקינים");
  }
}
async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    const parts = (await ctx.params).path;
    const route = parts.join("/");
    const method = req.method;
    if (method !== "GET") {
      const expected = new URL(
        process.env.APP_ORIGIN || "http://localhost:3000",
      ).origin;
      if (req.headers.get("origin") !== expected)
        throw new AppError("מקור הבקשה אינו מורשה", 403);
    }
    const ok = (data: unknown = { ok: true }) =>
      NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
    if (route === "health" && method === "GET") {
      await getEvents();
      return ok({
        ok: true,
        revision: process.env.RELEASE_REVISION || "local",
      });
    }
    if (parts[0] === "media" && method === "GET") {
      if (parts.length !== 2 || !/^[a-f0-9-]+\.webp$/.test(parts[1]))
        throw new AppError("התמונה לא נמצאה", 404);
      try {
        const bytes = await fs.readFile(
          /* turbopackIgnore: true */ path.join(
            /* turbopackIgnore: true */ uploadDir(),
            parts[1],
          ),
        );
        return new NextResponse(bytes, {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      } catch {
        throw new AppError("התמונה לא נמצאה", 404);
      }
    }
    // Caddy replaces this header. Do not expose the application port to the internet.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "local";
    if (route === "auth/login" && method === "POST") {
      await rateLimit(`login:${hashToken(ip)}`, 8, 900);
      const data = await json(req);
      if (
        !data ||
        typeof data.password !== "string" ||
        data.password.length > 200
      )
        throw new AppError("פרטי הכניסה אינם נכונים", 401);
      if (!(await login(data.password)))
        throw new AppError("הסיסמה אינה נכונה", 401);
      return ok();
    }
    if (route === "auth/logout" && method === "POST") {
      await logout();
      return ok();
    }
    if (route === "events" && method === "GET") {
      const events = await getEvents();
      return ok(events.map(({ pending, waitlist, paid, ...e }) => e));
    }
    if (
      parts[0] === "events" &&
      parts.length === 3 &&
      parts[2] === "register" &&
      method === "POST"
    ) {
      await rateLimit(`register:${hashToken(ip)}`, 12, 600);
      return ok(await register(parts[1], await json(req)));
    }
    if (parts[0] !== "admin") throw new AppError("העמוד לא נמצא", 404);
    if (!(await isAdmin())) throw new AppError("יש להתחבר מחדש לניהול", 401);
    if (route === "admin/events" && method === "GET")
      return ok(await getEvents(true));
    if (route === "admin/events" && method === "POST")
      return ok({ id: await saveEvent(await json(req)) });
    if (route === "admin/upload" && method === "POST") {
      const bytes = await body(req, 12 * 1024 * 1024);
      const form = await new Request(req.url, {
        method: "POST",
        headers: { "content-type": req.headers.get("content-type") || "" },
        body: bytes,
      }).formData();
      const file = form.get("file");
      if (
        !(file instanceof File) ||
        file.size > 10 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw new AppError("יש לבחור תמונת JPG, PNG או WebP עד 10MB");
      let output: Buffer;
      try {
        const decoded = sharp(Buffer.from(await file.arrayBuffer()), {
          limitInputPixels: 40000000,
        });
        const metadata = await decoded.metadata();
        if (!["jpeg", "png", "webp"].includes(metadata.format || ""))
          throw new Error("Unsupported image format");
        output = await decoded
          .rotate()
          .resize({
            width: 1800,
            height: 2400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        throw new AppError(
          "לא ניתן לקרוא את התמונה. נסי תמונת JPG או PNG אחרת.",
        );
      }
      await fs.mkdir(uploadDir(), { recursive: true });
      const name = `${randomUUID()}.webp`;
      await fs.writeFile(path.join(uploadDir(), name), output);
      return ok({ url: `/api/media/${name}` });
    }
    if (parts[1] === "events" && parts[2]) {
      const id = parts[2];
      if (parts.length === 3 && method === "GET") {
        const event = await getEvent(id, true);
        if (!event) throw new AppError("האירוע לא נמצא", 404);
        return ok(event);
      }
      if (parts.length === 3 && method === "PATCH")
        return ok({ id: await saveEvent(await json(req), id) });
      if (parts.length === 4 && parts[3] === "registrations") {
        if (method === "GET") return ok(await registrations(id));
        if (method === "POST")
          return ok(await register(id, await json(req), true));
      }
      if (parts.length === 5 && parts[3] === "registrations") {
        if (method === "PATCH") {
          await updateRegistration(id, parts[4], await json(req));
          return ok();
        }
        if (method === "DELETE") {
          await removeRegistration(id, parts[4]);
          return ok();
        }
      }
    }
    throw new AppError("הפעולה לא נמצאה", 404);
  } catch (e) {
    if (e instanceof AppError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ZodError)
      return NextResponse.json(
        {
          error: /[\u0590-\u05ff]/.test(e.issues[0]?.message || "")
            ? e.issues[0].message
            : "יש לבדוק שהפרטים מלאים ותקינים: שם, תאריך, מיקום, מחיר ומכסה.",
        },
        { status: 400 },
      );
    console.error("Request failed", e);
    return NextResponse.json(
      { error: "לא הצלחנו להשלים את הפעולה. נסי שוב בעוד רגע." },
      { status: 500 },
    );
  }
}
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
