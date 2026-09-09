import { ImageResponse } from "next/og";
import { OG_SIZE, OgFrame, asJpeg, ogFonts, photoDataUri } from "@/lib/og";

export const alt = "Koral Events — ערבים לנשים, מהלב";
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
        kicker="ערבי נשים · ללא מטרות רווח"
        title="״אישה לאישה מלכה״"
        meta="שיעורי תורה, הפרשת חלה, לילות בכותל, ערבי העצמה ומסיבות"
      />,
      { ...OG_SIZE, fonts },
    ),
  );
}
