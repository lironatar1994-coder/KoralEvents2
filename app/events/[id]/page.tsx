import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpLeft,
  CalendarDays,
  Clock3,
  Info,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { getEvent, getEvents } from "@/lib/events";
import {
  Header,
  Footer,
  EventImage,
  EventCard,
  Price,
  SeatsTag,
} from "@/components/Public";
import { dateLabel, timeLabel, priceLabel } from "@/lib/types";
import { RegistrationForm } from "@/components/RegistrationForm";
import { ScrollReveal } from "@/components/ScrollReveal";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const e = await getEvent((await params).id);
  return {
    title: e?.title || "הערב הזה לא נמצא",
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
  const left =
    e.capacity !== null ? Math.max(0, e.capacity - e.approved) : null;
  return (
    <div className="public-site public-event">
      <Header />
      <main id="main">
        <section className={`k-poster ${flyer ? "is-flyer" : ""}`}>
          <Link
            href="/#events"
            className="k-poster-back"
            aria-label="כל הערבים"
          >
            <ArrowRight size={22} />
          </Link>
          <div className="detail-visual">
            <EventImage event={e} priority />
            {!flyer && <div className="k-poster-shade" aria-hidden="true" />}
          </div>
          <div className="k-wrap k-poster-title">
            <span className="k-tag">{e.category}</span>
            <h1>{e.title}</h1>
            <p className="k-poster-facts">
              <span>
                <CalendarDays size={16} />{" "}
                {dateLabel(e.starts_at, { weekday: "long" })}
              </span>
              <span>
                <Clock3 size={16} /> {timeLabel(e.starts_at)}
              </span>
              <span>
                <MapPin size={16} /> {e.location}
              </span>
              <Price price={e.price} />
              <SeatsTag event={e} />
            </p>
          </div>
        </section>

        <div className="k-wrap k-detail">
          <article className="k-detail-body">
            {e.subtitle && (
              <p className="k-detail-sub" data-reveal>
                {e.subtitle}
              </p>
            )}
            {e.address && (
              <a
                data-reveal
                className="k-map"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.address)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={16} />
                <span>{e.address}</span>
                <ArrowUpLeft size={16} />
              </a>
            )}
            <p className="k-detail-desc" data-reveal>
              {e.description}
            </p>
            {e.price > 0 && (
              <p className="k-detail-hint" data-reveal>
                <Info size={16} />
                <span>התשלום לא באתר. מסדרים אותו עם המנהלת אחרי האישור.</span>
              </p>
            )}
            <ul className="k-detail-facts" data-reveal>
              <li>
                <CalendarDays size={18} />
                <div>
                  <small>מתי</small>
                  <strong>
                    {dateLabel(e.starts_at, { weekday: "long" })} ·{" "}
                    {timeLabel(e.starts_at)}
                  </strong>
                </div>
              </li>
              <li>
                <MapPin size={18} />
                <div>
                  <small>איפה</small>
                  <strong>{e.location}</strong>
                </div>
              </li>
              <li>
                <Ticket size={18} />
                <div>
                  <small>עלות</small>
                  <strong>{priceLabel(e.price)}</strong>
                </div>
              </li>
              <li>
                <Users size={18} />
                <div>
                  <small>מקומות</small>
                  <strong>
                    {left === null
                      ? "ללא הגבלה"
                      : left === 0
                        ? "מלא · רשימת המתנה"
                        : `נשארו ${left} מקומות`}
                  </strong>
                </div>
              </li>
            </ul>
          </article>
          <aside className="k-detail-side">
            <RegistrationForm event={e} open={open} full={full} />
          </aside>
        </div>

        {others.length > 0 && (
          <section className="k-related">
            <div className="k-wrap">
              <header className="k-section-head" data-reveal>
                <div>
                  <p className="k-eyebrow">ממשיכות</p>
                  <h2>עוד ערבים שמחכים לנו.</h2>
                </div>
              </header>
              <div className="k-grid">
                {others.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={index}
                    variant="compact"
                    reveal
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <ScrollReveal />
    </div>
  );
}
