import Link from "next/link";
import { ArrowUpLeft, MapPin, ArrowLeft, Sparkles } from "lucide-react";
import { Brand } from "./Brand";
import { KoralEvent, dateLabel, timeLabel, priceLabel } from "@/lib/types";
export function Header() {
  return (
    <header className="site-header">
      <Brand />
      <nav aria-label="ניווט ראשי">
        <Link href="/#events">האירועים שלנו</Link>
        <Link className="nav-about" href="/#about">
          קצת עלינו
        </Link>
      </nav>
      <span className="header-note">
        <span className="live-dot" /> הלילה שייך לנו
      </span>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <Brand small />
      <p>נשים נפגשות. רגעים שנשארים.</p>
      <div>
        <span>© {new Date().getFullYear()} Koral Events</span>
        <Link href="/admin">
          כניסת מנהלת <ArrowUpLeft size={14} />
        </Link>
      </div>
    </footer>
  );
}
export function EventImage({
  event,
  className = "",
  priority = false,
}: {
  event: KoralEvent;
  className?: string;
  priority?: boolean;
}) {
  return event.image ? (
    <img
      className={`${className} image-${event.image_mode}`}
      src={event.image}
      alt={event.title}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
    />
  ) : (
    <div className={`${className} image-placeholder`}>
      <Sparkles size={42} />
      <span>KORAL EVENTS</span>
    </div>
  );
}
export function EventCard({
  event,
  index = 0,
}: {
  event: KoralEvent;
  index?: number;
}) {
  const full = event.capacity !== null && event.approved >= event.capacity;
  return (
    <Link
      href={`/events/${event.id}`}
      className="event-card"
      style={{ "--delay": `${index * 80}ms` } as React.CSSProperties}
    >
      <div className="card-image">
        <EventImage event={event} />
        <span className="card-category">{event.category}</span>
        <span className="card-arrow">
          <ArrowUpLeft size={23} />
        </span>
        {(full || event.state === "closed") && (
          <span className="card-state">
            {event.state === "closed" ? "ההרשמה נסגרה" : "נותר להצטרף להמתנה"}
          </span>
        )}
      </div>
      <div className="card-meta">
        <span>
          {dateLabel(event.starts_at)} <i /> {timeLabel(event.starts_at)}
        </span>
        <span>{priceLabel(event.price)}</span>
      </div>
      <div className="card-title-row">
        <h3>{event.title}</h3>
        <span className="card-number" aria-hidden="true">
          {(index + 1).toString().padStart(2, "0")}
        </span>
      </div>
      <p className="card-location">
        <MapPin size={14} />
        {event.location}
      </p>
    </Link>
  );
}
export function BackLink() {
  return (
    <Link href="/#events" className="back-link">
      <ArrowLeft size={16} /> כל האירועים
    </Link>
  );
}
