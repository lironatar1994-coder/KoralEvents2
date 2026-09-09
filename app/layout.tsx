import { appPath } from "@/lib/paths";
import type { Metadata } from "next";
import "./globals.css";
import "./typography.css";
import "./dashboard.css";
import "./site.css";
import "./admin-theme.css";
import "./ticket.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    appPath("/"),
    process.env.APP_ORIGIN || "http://localhost:3000",
  ),
  icons: {
    icon: [
      { url: appPath("/icon.svg?v=4"), type: "image/svg+xml" },
      {
        url: appPath("/icon-512.png?v=4"),
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: appPath("/apple-touch-icon.png?v=4"),
  },
  title: {
    default: "״אישה לאישה מלכה״ | ערבי נשים לזיכוי הרבות",
    template: "%s | ״אישה לאישה מלכה״",
  },
  description:
    "ערבי נשים לזיכוי הרבות: שיעורי תורה, הפרשת חלה, לילות בכותל, ערבי העצמה ומסיבות. לנשים בלבד, ללא מטרות רווח. נרשמות בשם ובטלפון, והמקום שלך שמור.",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "״אישה לאישה מלכה״",
    title: "״אישה לאישה מלכה״ | ערבי נשים לזיכוי הרבות",
    description:
      "שיעורי תורה, הפרשת חלה, לילות בכותל, ערבי העצמה ומסיבות. לנשים בלבד, ללא מטרות רווח. נרשמות בשם ובטלפון, והמקום שלך שמור.",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <a className="skip-link" href="#main">
          דילוג לתוכן
        </a>
        {children}
      </body>
    </html>
  );
}
