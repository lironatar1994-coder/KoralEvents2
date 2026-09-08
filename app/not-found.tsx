import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";
import { Header, Footer } from "@/components/Public";
export default function NotFound() {
  return (
    <div className="public-site">
      <Header />
      <main id="main" className="k-simple">
        <h1>הרגע הזה לא נמצא.</h1>
        <p>אולי הקישור השתנה, או שהערב כבר עבר.</p>
        <Link className="k-btn k-btn-rose" href="/">
          לערבים הקרובים <ArrowUpLeft size={18} />
        </Link>
      </main>
      <Footer />
    </div>
  );
}
