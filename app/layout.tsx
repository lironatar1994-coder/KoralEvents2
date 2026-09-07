import type { Metadata } from "next";
import "./globals.css";
import "./public.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN || "http://localhost:3000"),
  icons: { icon: "/icon.svg" },
  title: {
    default: "Koral Events | רגעים ששווה לצאת בשבילם",
    template: "%s | Koral Events",
  },
  description:
    "ערבים, מסיבות וטיולי לילה לנשים בלבד, ללא מטרות רווח. מערב בכותל ועד מסיבת פורים — גלי את הלילה הבא שלך.",
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
        {process.env.DATABASE_PATH?.endsWith("demo.sqlite") && (
          <div className="demo-notice">
            תצוגה לדוגמה · התאריכים, המחירים ופרטי האירועים להמחשה בלבד
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
