import Link from "next/link";
import { ArrowUpLeft, MapPin, Sparkles } from "lucide-react";
import { Brand } from "./Brand";
import { KoralEvent, dateLabel, timeLabel, priceLabel } from "@/lib/types";
export function Header() {
  return (
    <header className="site-header">
      <Brand />
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
  compact = false,
}: {
  event: KoralEvent;
  className?: string;
  priority?: boolean;
  compact?: boolean;
}) {
  const img = (
    <img
      className={`${className} image-${event.image_mode}`}
      src={event.image}
      alt={event.title}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
    />
  );
  return event.image ? (
    event.image_wide && !compact ? (
      <picture>
        <source media="(min-width: 1000px)" srcSet={event.image_wide} />
        {img}
      </picture>
    ) : (
      img
    )
  ) : (
    <div className={`${className} image-placeholder`}>
      <Sparkles size={42} />
      <span>KORAL EVENTS</span>
    </div>
  );
}
function StateBadge({ event }: { event: KoralEvent }) {
  const full = event.capacity !== null && event.approved >= event.capacity;
  if (!full && event.state !== "closed") return null;
  return (
    <span className="card-state">
      {event.state === "closed" ? "ההרשמה נסגרה" : "נותר להצטרף להמתנה"}
    </span>
  );
}
export function EventCard({
  event,
  index = 0,
  variant = "featured",
}: {
  event: KoralEvent;
  index?: number;
  variant?: "featured" | "compact";
}) {
  const style = { "--delay": `${index * 80}ms` } as React.CSSProperties;
  if (variant === "compact")
    return (
      <Link
        href={`/events/${event.id}`}
        className="event-card card-compact"
        style={style}
      >
        <div className="card-thumb">
          <EventImage event={event} compact />
        </div>
        <div className="card-body">
          <h3>{event.title}</h3>
          <p className="card-facts">
            <span>{dateLabel(event.starts_at)}</span>
            <i />
            <span>{timeLabel(event.starts_at)}</span>
            <i />
            <span>{event.location}</span>
          </p>
          <StateBadge event={event} />
        </div>
        <span className="card-arrow">
          <ArrowUpLeft size={22} />
        </span>
      </Link>
    );
  return (
    <Link
      href={`/events/${event.id}`}
      className="event-card card-featured"
      style={style}
    >
      <div className="card-image">
        <EventImage event={event} priority={index === 0} />
        <span className="card-category">{event.category}</span>
        <StateBadge event={event} />
      </div>
      <div className="card-overlay">
        <p className="card-facts">
          <span>{dateLabel(event.starts_at, { weekday: "long" })}</span>
          <i />
          <span>{timeLabel(event.starts_at)}</span>
          <b>{priceLabel(event.price)}</b>
        </p>
        <h3>{event.title}</h3>
        <p className="card-facts">
          <MapPin size={14} /> {event.location}
        </p>
        <span className="card-cta">
          אני באה <ArrowUpLeft size={18} />
        </span>
      </div>
    </Link>
  );
}
