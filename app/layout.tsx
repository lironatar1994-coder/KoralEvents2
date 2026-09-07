import { appPath } from "@/lib/paths";
import type { Metadata } from "next";
import "./globals.css";
import "./public.css";
import "./typography.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN || "http://localhost:3000"),
  icons: {
    icon: appPath("/icon.svg"),
    apple: appPath("/apple-touch-icon.png"),
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
