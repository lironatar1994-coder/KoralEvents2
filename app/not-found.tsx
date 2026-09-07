import Link from "next/link";
import { Header, Footer } from "@/components/Public";
export default function NotFound() {
  return (
    <div className="public-site">
      <Header />
      <main id="main" className="empty-public page-width">
        <h1>הרגע הזה לא נמצא.</h1>
        <p>יכול להיות שהקישור השתנה או שהאירוע כבר אינו זמין.</p>
        <Link className="button gold-button" href="/">
          לאירועים שלנו
        </Link>
      </main>
      <Footer />
    </div>
  );
}
