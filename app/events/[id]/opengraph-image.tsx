import { ImageResponse } from "next/og";
import { getEvent } from "@/lib/events";
import { dateLabel, timeLabel, priceLabel } from "@/lib/types";
import { OG_SIZE, OgFrame, asJpeg, ogFonts, photoDataUri } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/jpeg";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const e = await getEvent((await params).id);
  const fonts = await ogFonts();
  if (!e)
    return asJpeg(
      new ImageResponse(
        <OgFrame
          photo={await photoDataUri(
            "/brand/hero-signature-landscape.webp",
            "west",
          )}
          kicker="לנשים בלבד · ללא מטרות רווח"
          title="ערבי נשים לזיכוי הרבות."
        />,
        { ...OG_SIZE, fonts },
      ),
    );
  const flyer = e.image_mode === "contain";
  const photo = await photoDataUri(
    e.image_wide || e.image,
    "centre",
    flyer ? "contain" : "cover",
  );
  const meta = [
    dateLabel(e.starts_at, { weekday: "long" }),
    timeLabel(e.starts_at),
    e.location,
    priceLabel(e.price),
  ].join(" · ");
  return asJpeg(
    new ImageResponse(
      <OgFrame photo={photo} kicker={e.category} title={e.title} meta={meta} />,
      { ...OG_SIZE, fonts },
    ),
  );
}
