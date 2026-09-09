import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/*
 * Shared pieces for the link-preview images (Open Graph). The renderer lays
 * text out left-to-right only, so Hebrew is handed to it in visual order:
 * runs of Hebrew are reversed character by character, numbers and Latin stay
 * as they are, and the run order is flipped. Long titles are wrapped by hand
 * for the same reason.
 */
export const OG_SIZE = { width: 1200, height: 630 };

const KEEP = /[0-9A-Za-z:./%₪+-]+/;
export function rtl(text: string): string {
  const runs = text.match(/[0-9A-Za-z:./%₪+-]+|[^0-9A-Za-z:./%₪+-]+/g) ?? [];
  return runs
    .reverse()
    .map((run) =>
      new RegExp(`^${KEEP.source}$`).test(run)
        ? run
        : Array.from(run).reverse().join(""),
    )
    .join("");
}
export function rtlLines(text: string, fontSize: number, maxWidth: number) {
  const perChar = fontSize * 0.52;
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length * perChar > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.map(rtl);
}
/* Pick a title size that keeps the whole title inside two lines. */
export function titleSize(text: string) {
  if (text.length <= 14) return 92;
  if (text.length <= 24) return 74;
  if (text.length <= 40) return 60;
  return 48;
}

const fontDir = path.join(process.cwd(), "assets", "fonts");
export async function ogFonts() {
  const [frank, cormorant, heebo] = await Promise.all(
    ["frankruhllibre", "cormorantgaramond", "heebo"].map((f) =>
      fs.readFile(/* turbopackIgnore: true */ path.join(fontDir, `${f}.ttf`)),
    ),
  );
  return [
    {
      name: "FrankRuhl",
      data: frank,
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "Cormorant",
      data: cormorant,
      weight: 600 as const,
      style: "italic" as const,
    },
    {
      name: "Heebo",
      data: heebo,
      weight: 500 as const,
      style: "normal" as const,
    },
  ];
}

const uploadDir = () =>
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
/* Event photo (uploaded file or remote URL), or the brand scene, as a JPEG data URI. */
export async function photoDataUri(
  source: string,
  position: "west" | "centre" = "centre",
  fit: "cover" | "contain" = "cover",
) {
  let input: Buffer | undefined;
  try {
    const media = source.match(/^\/api\/media\/([a-f0-9-]+\.webp)$/);
    if (media)
      input = await fs.readFile(
        path.join(/* turbopackIgnore: true */ uploadDir(), media[1]),
      );
    else if (source.startsWith("/brand/"))
      input = await fs.readFile(
        /* turbopackIgnore: true */ path.join(process.cwd(), "public", source),
      );
    else if (/^https:\/\//.test(source)) {
      const r = await fetch(source, { signal: AbortSignal.timeout(4000) });
      if (r.ok) input = Buffer.from(await r.arrayBuffer());
    }
  } catch {
    input = undefined;
  }
  if (!input)
    input = await fs.readFile(
      path.join(
        process.cwd(),
        "public",
        "brand",
        "hero-signature-landscape.webp",
      ),
    );
  const jpeg = await sharp(input)
    .resize(OG_SIZE.width, OG_SIZE.height, {
      fit,
      position,
      background: "#1a1120",
    })
    .jpeg({ quality: 82 })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

/* Link previews must stay small (WhatsApp drops large ones): PNG → JPEG. */
export async function asJpeg(image: Response) {
  const jpeg = await sharp(Buffer.from(await image.arrayBuffer()))
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
    },
  });
}

/* The frame: photo, night gradient towards the text side, wordmark, copy. */
export function OgFrame({
  photo,
  kicker,
  title,
  meta,
  contain = false,
}: {
  photo: string;
  kicker: string;
  title: string;
  meta?: string;
  contain?: boolean;
}) {
  const size = titleSize(title);
  const lines = rtlLines(title, size, 1040);
  return (
    <div
      style={{
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        display: "flex",
        position: "relative",
        background: "#1a1120",
        fontFamily: "Heebo",
        color: "#f8f1e6",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        width={OG_SIZE.width}
        height={OG_SIZE.height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          objectFit: contain ? "contain" : "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          background:
            "linear-gradient(0deg, rgba(26,17,32,0.96) 0%, rgba(26,17,32,0.55) 38%, rgba(26,17,32,0) 68%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          background:
            "linear-gradient(180deg, rgba(26,17,32,0.7) 0%, rgba(26,17,32,0) 30%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 60,
          top: 44,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            fontFamily: "Cormorant",
            fontStyle: "italic",
            fontSize: 50,
            color: "#f4dfb0",
            lineHeight: 1,
          }}
        >
          Koral Events
        </div>
        <div
          style={{
            width: 14,
            height: 14,
            background: "#d9b366",
            transform: "rotate(45deg)",
            borderRadius: 2,
            marginTop: -18,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: 60,
          bottom: 56,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: "#f4dfb0",
          }}
        >
          <div style={{ width: 36, height: 2, background: "#d9b366" }} />
          <div>{rtl(kicker)}</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            fontFamily: "FrankRuhl",
            fontSize: size,
            lineHeight: 1.08,
          }}
        >
          {lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        {meta && (
          <div style={{ fontSize: 24, color: "#f8f1e6", opacity: 0.92 }}>
            {rtl(meta)}
          </div>
        )}
      </div>
    </div>
  );
}
