import { appPath } from "@/lib/paths";
import type { Metadata } from "next";
import "./globals.css";
import "./public.css";
import "./motion.css";
import "./typography.css";
import "./dashboard.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN || "http://localhost:3000"),
  icons: {
    icon: [
      { url: appPath("/icon.svg?v=2"), type: "image/svg+xml" },
      {
        url: appPath("/icon-512.png?v=2"),
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: appPath("/apple-touch-icon.png?v=2"),
  },
  title: {
    default: "Koral Events | ערבים לנשים, מהלב",
    template: "%s | Koral Events",
  },
  description:
    "אירועים לנשים ללא מטרות רווח: שיעורי תורה, מסיבות, הפרשת חלה, ערבי העצמה ולילות בכותל. נרשמות בשם ובטלפון, והמקום שלך שמור.",
  robots: { index: true, follow: true },
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
