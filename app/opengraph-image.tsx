import { ImageResponse } from "next/og";
import { OG_SIZE, OgFrame, asJpeg, ogFonts, photoDataUri } from "@/lib/og";

export const alt = "״אישה לאישה מלכה״ — ערבי נשים לזיכוי הרבות";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

export default async function Image() {
  const [photo, fonts] = await Promise.all([
    photoDataUri("/brand/hero-signature-landscape.webp", "west"),
    ogFonts(),
  ]);
  return asJpeg(
    new ImageResponse(
      <OgFrame
        photo={photo}
        kicker="לנשים בלבד · ללא מטרות רווח"
        title="ערבי נשים לזיכוי הרבות."
        meta="שיעורי תורה · הפרשת חלה · לילות בכותל · ערבי העצמה · מסיבות"
      />,
      { ...OG_SIZE, fonts },
    ),
  );
}
