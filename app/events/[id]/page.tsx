import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowRight, ArrowUpLeft } from "lucide-react";
import { getEvent, getEvents } from "@/lib/events";
import { Header, Footer, EventImage, EventCard } from "@/components/Public";
import { dateLabel, timeLabel, priceLabel } from "@/lib/types";
import { RegistrationForm } from "@/components/RegistrationForm";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const e = await getEvent((await params).id);
  return {
    title: e?.title || "האירוע לא נמצא",
    description: e?.subtitle || e?.description.slice(0, 160),
    openGraph: e
      ? {
          title: e.title,
          description: e.subtitle,
          images: e.image ? [e.image] : [],
        }
      : undefined,
  };
}
export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const e = await getEvent((await params).id);
  if (!e) notFound();
  const others = (await getEvents()).filter((x) => x.id !== e.id).slice(0, 3);
  const open = e.state === "published" && new Date(e.starts_at) > new Date();
  const full = e.capacity !== null && e.approved >= e.capacity;
  const flyer = e.image_mode === "contain";
  const title = (
    <div className="poster-title">
      <h1>{e.title}</h1>
      <p className="poster-facts">
        <span>{dateLabel(e.starts_at, { weekday: "long" })}</span>
        <i />
        <span>{timeLabel(e.starts_at)}</span>
        <i />
        <span>
          <MapPin size={15} /> {e.location}
        </span>
        <b className="poster-price">{priceLabel(e.price)}</b>
      </p>
    </div>
  );
  return (
    <div className="public-site public-event">
      <Header />
      <main id="main" className="detail-main">
        <section className={`event-poster ${flyer ? "is-flyer" : ""}`}>
          <div className="detail-visual">
            <EventImage event={e} priority />
            {!flyer && <div className="poster-shade" aria-hidden="true" />}
            <Link
              href="/#events"
              className="poster-back"
              aria-label="כל האירועים"
            >
              <ArrowRight size={22} />
            </Link>
            <span className="detail-category glass-tag">{e.category}</span>
            {!flyer && title}
          </div>
          {flyer && <div className="page-width">{title}</div>}
        </section>
        <div className="detail-info page-width">
          {e.subtitle && <p className="detail-subtitle">{e.subtitle}</p>}
          {e.address && (
            <a
              className="poster-map"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.address)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={16} />
              <span>{e.address}</span>
              <ArrowUpLeft size={16} />
            </a>
          )}
          <p className="detail-description">{e.description}</p>
          {e.price > 0 && (
            <p className="field-hint">
              התשלום בנפרד, בתיאום עם המנהלת. אין תשלום באתר.
            </p>
          )}
          <RegistrationForm eventId={e.id} open={open} full={full} />
        </div>
        {others.length > 0 && (
          <section className="related page-width">
            <div className="section-heading">
              <h2>עוד ערבים ששווה לצאת בשבילם.</h2>
            </div>
            <div className="event-list">
              {others.map((event) => (
                <EventCard key={event.id} event={event} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
