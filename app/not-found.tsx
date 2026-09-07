import Link from "next/link";
import { Header, Footer } from "@/components/Public";
export default function NotFound() {
  return (
    <div className="public-site">
      <Header />
      <main id="main" className="empty-public page-width">
        <h1>הרגע הזה לא נמצא.</h1>
        <p>אולי הקישור השתנה, או שהערב כבר עבר.</p>
        <Link className="button gold-button" href="/">
          לערבים הקרובים
        </Link>
      </main>
      <Footer />
    </div>
  );
}
