import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Clock3, ArrowUpLeft } from "lucide-react";
import { getEvent, getEvents } from "@/lib/events";
import {
  Header,
  Footer,
  EventImage,
  BackLink,
  EventCard,
} from "@/components/Public";
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
  return (
    <div className="public-site public-event">
      <Header />
      <main id="main" className="detail-main page-width">
        <BackLink />
        <div className="event-detail">
          <div className="detail-visual">
            <EventImage event={e} priority />
            <span className="detail-category glass-tag">{e.category}</span>
          </div>
          <div className="detail-info">
            <div className="eyebrow">כאן מתחיל הרגע הבא שלך</div>
            <h1>{e.title}</h1>
            <p className="detail-subtitle">{e.subtitle}</p>
            <div className="detail-facts">
              <div>
                <CalendarDays />
                <span>
                  מתי נפגשות?
                  <strong>{dateLabel(e.starts_at, { weekday: "long" })}</strong>
                </span>
              </div>
              <div>
                <Clock3 />
                <span>
                  מתחילות בשעה<strong>{timeLabel(e.starts_at)}</strong>
                </span>
              </div>
              <div>
                <MapPin />
                <span>
                  איפה זה קורה?<strong>{e.location}</strong>
                  {e.address && <small>{e.address}</small>}
                </span>
                {e.address && (
                  <a
                    className="icon-button"
                    aria-label="ניווט למיקום"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.address)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ArrowUpLeft size={18} />
                  </a>
                )}
              </div>
            </div>
            <p className="detail-description">{e.description}</p>
            <div className="price-row">
              <span>עלות השתתפות</span>
              <strong>{priceLabel(e.price)}</strong>
            </div>
            {e.price > 0 && (
              <p className="field-hint">
                התשלום בנפרד, בתיאום עם המנהלת. אין תשלום באתר.
              </p>
            )}
            <RegistrationForm eventId={e.id} open={open} full={full} />
          </div>
        </div>
        {others.length > 0 && (
          <section className="related">
            <div className="section-heading">
              <h2>עוד רגעים ששווה לצאת בשבילם.</h2>
            </div>
            <div className="event-grid">
              {others.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
