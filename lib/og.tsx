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
export const BRAND = "״אישה לאישה מלכה״";
/* The queen's crown from the favicon, as inline SVG for the renderer. */
export function CrownMark({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path
        d="M11 44 L6 19 L21.5 31 L32 11 L42.5 31 L58 19 L53 44 Z"
        fill="#f4dfb0"
      />
      <path
        d="M12 47 h40 a3.5 3.5 0 0 1 3.5 3.5 v2 a3.5 3.5 0 0 1 -3.5 3.5 h-40 a3.5 3.5 0 0 1 -3.5 -3.5 v-2 a3.5 3.5 0 0 1 3.5 -3.5 z"
        fill="#f4dfb0"
      />
      <circle cx="6" cy="19" r="3.4" fill="#d9b366" />
      <circle cx="32" cy="11" r="3.8" fill="#d9b366" />
      <circle cx="58" cy="19" r="3.4" fill="#d9b366" />
      <circle cx="32" cy="36" r="3.2" fill="#c6405f" />
    </svg>
  );
}

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
  const [frank, frankRegular, cormorant, heebo] = await Promise.all(
    [
      "frankruhllibre",
      "frankruhllibre-regular",
      "cormorantgaramond",
      "heebo",
    ].map((f) =>
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
      name: "FrankRuhl",
      data: frankRegular,
      weight: 400 as const,
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
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              fontFamily: "FrankRuhl",
              fontSize: 40,
              color: "#f4dfb0",
              lineHeight: 1,
            }}
          >
            {rtl(BRAND)}
          </div>
          <div
            style={{
              fontFamily: "Cormorant",
              fontStyle: "italic",
              fontSize: 22,
              color: "#f4dfb0",
              opacity: 0.8,
              marginTop: 6,
            }}
          >
            Koral Events
          </div>
        </div>
        <CrownMark size={64} />
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

/* The home preview mirrors the site's first screen: photo on the left, the
   two-line headline with the gold flourish on the right, tagline beneath. */
export function HeroFrame({ photo }: { photo: string }) {
  const night = "rgba(26,17,32,";
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
        style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          background: `linear-gradient(90deg, ${night}0) 34%, ${night}0.55) 58%, ${night}0.92) 78%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          background: `linear-gradient(0deg, ${night}0.9) 0%, ${night}0.35) 30%, ${night}0) 55%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          background: `linear-gradient(180deg, ${night}0.6) 0%, ${night}0) 26%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 56,
          top: 40,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: "Cormorant",
            fontStyle: "italic",
            fontSize: 30,
            color: "#f4dfb0",
            opacity: 0.85,
          }}
        >
          Koral Events
        </div>
        <CrownMark size={46} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 56,
          bottom: 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 20,
            fontWeight: 600,
            color: "#f4dfb0",
            marginBottom: 14,
          }}
        >
          <div style={{ width: 40, height: 1, background: "#d9b366" }} />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: "#c6405f",
            }}
          />
          <div>{rtl("ערבי נשים · ללא מטרות רווח")}</div>
        </div>
        <div
          style={{
            fontFamily: "FrankRuhl",
            fontWeight: 400,
            fontSize: 54,
            lineHeight: 1,
            color: "#f8f1e6",
          }}
        >
          {rtl("״אישה לאישה")}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
            marginTop: 2,
          }}
        >
          <div
            style={{
              fontFamily: "FrankRuhl",
              fontWeight: 400,
              fontSize: 80,
              lineHeight: 1,
              color: "#f4dfb0",
              opacity: 0.85,
              marginTop: 6,
            }}
          >
            ״
          </div>
          <div
            style={{
              fontFamily: "FrankRuhl",
              fontWeight: 700,
              fontSize: 196,
              lineHeight: 0.92,
              color: "#f4dfb0",
            }}
          >
            {rtl("מלכה")}
          </div>
        </div>
        <svg
          width={300}
          height={26}
          viewBox="0 0 320 26"
          style={{ marginTop: 6, marginRight: 8 }}
        >
          <path
            d="M3 18 C 60 4, 110 26, 170 12 S 270 4, 317 10"
            fill="none"
            stroke="#d9b366"
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ fontSize: 28, color: "#f8f1e6", marginTop: 14 }}>
          {rtl("ערבי נשים לזיכוי הרבות.")}
        </div>
      </div>
    </div>
  );
}
