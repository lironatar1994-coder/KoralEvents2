import { appPath } from "@/lib/paths";
import Link from "next/link";
import { ArrowDown, ArrowUpLeft, Clock3, MapPin, Sparkles } from "lucide-react";
import { Brand } from "./Brand";
import { HeaderScroll } from "./HeaderScroll";
import {
  KoralEvent,
  dateLabel,
  timeLabel,
  priceLabel,
  weekdayLabel,
} from "@/lib/types";

/* Day and month, pulled apart for the calendar leaf. */
export function dateParts(value: string) {
  const parts = new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "short",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: get("day"), month: get("month") };
}

/* Calendar days from now until the evening, in Jerusalem time. */
export function daysUntil(value: string, now = new Date()) {
  const key = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jerusalem",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  const [a, b] = [key(now), key(new Date(value))].map((k) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86400000);
}
export function countdownLabel(value: string) {
  const n = daysUntil(value);
  if (n < 0) return "עבר";
  if (n === 0) return "הערב!";
  if (n === 1) return "מחר";
  if (n === 2) return "מחרתיים";
  return `בעוד ${n} ימים`;
}
/* Shown only when seats are actually running out. */
export function SeatsTag({ event }: { event: KoralEvent }) {
  if (event.capacity === null || event.state !== "published") return null;
  const left = event.capacity - event.approved;
  if (left <= 0 || left > Math.max(5, Math.ceil(event.capacity * 0.2)))
    return null;
  return (
    <span className="k-tag urgent">
      {left === 1 ? "נשאר מקום אחרון" : `נשארו ${left} מקומות`}
    </span>
  );
}

export function DateLeaf({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const { day, month } = dateParts(value);
  return (
    <span className={`k-leaf ${className}`} aria-hidden="true">
      <b>{day}</b>
      <small>{month}</small>
    </span>
  );
}

export function Price({ price }: { price: number }) {
  return (
    <span className={`k-price ${price > 0 ? "" : "free"}`}>
      {priceLabel(price)}
    </span>
  );
}

export function Header() {
  return (
    <header className="k-header">
      <HeaderScroll />
      <div className="k-wrap k-header-row">
        <Brand />
        <nav className="k-nav" aria-label="ניווט ראשי">
          <Link href="/#events">הערבים הקרובים</Link>
          <Link href="/#about">מי אנחנו</Link>
        </nav>
        <Link href="/#events" className="k-btn k-btn-ghost k-btn-down">
          הערב הבא <ArrowDown size={16} />
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="k-footer">
      <div className="k-wrap">
        <div className="k-footer-row">
          <div>
            <Brand small />
            <p className="k-footer-tag">
              ״אישה לאישה מלכה״ · ערבי נשים לזיכוי הרבות.
            </p>
          </div>
          <div className="k-footer-links">
            <Link href="/#events">הערבים הקרובים</Link>
            <Link href="/#about">מי אנחנו</Link>
            <Link href="/admin">
              כניסת מנהלת <ArrowUpLeft size={14} />
            </Link>
          </div>
        </div>
        <div className="k-footer-bottom">
          <span>© {new Date().getFullYear()} Koral Events</span>
          <span>
            נבנה על ידי{" "}
            <a href="https://lawebs.co.il" target="_blank" rel="noreferrer">
              lawebs
            </a>
            {" · "}
            <a href="tel:+972508611888" dir="ltr">
              050-8611888
            </a>
          </span>
        </div>
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
      src={appPath(event.image)}
      alt={event.title}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
    />
  );
  return event.image ? (
    event.image_wide && !compact ? (
      <picture>
        <source
          media="(min-width: 1000px)"
          srcSet={appPath(event.image_wide)}
        />
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

function StateTag({ event }: { event: KoralEvent }) {
  const full = event.capacity !== null && event.approved >= event.capacity;
  if (!full && event.state !== "closed") return null;
  return (
    <span className="k-tag warn">
      {event.state === "closed" ? "ההרשמה נסגרה" : "מלא · רשימת המתנה"}
    </span>
  );
}

export function EventCard({
  event,
  index = 0,
  variant = "featured",
  reveal = false,
}: {
  event: KoralEvent;
  index?: number;
  variant?: "featured" | "compact";
  reveal?: boolean;
}) {
  const style = {
    "--reveal-delay": `${Math.min(index, 4) * 60}ms`,
  } as React.CSSProperties;
  const revealAttr = reveal ? { "data-reveal": "" } : {};
  const weekday = weekdayLabel(event.starts_at);
  if (variant === "compact")
    return (
      <Link
        href={`/events/${event.id}`}
        className="event-card k-card"
        style={style}
        {...revealAttr}
      >
        <div className="k-card-media">
          <EventImage event={event} compact />
          <DateLeaf value={event.starts_at} />
          <StateTag event={event} />
          <SeatsTag event={event} />
        </div>
        <div className="k-card-body">
          <p className="k-card-kicker">{event.category}</p>
          <h3>{event.title}</h3>
          <p className="k-facts">
            <span>
              <Clock3 size={14} /> {weekday} · {timeLabel(event.starts_at)}
            </span>
            <span>
              <MapPin size={14} /> {event.location}
            </span>
          </p>
          <div className="k-card-foot">
            <Price price={event.price} />
            <span className="k-arrow" aria-hidden="true">
              <ArrowUpLeft size={20} />
            </span>
          </div>
        </div>
      </Link>
    );
  return (
    <Link
      href={`/events/${event.id}`}
      className="event-card k-card-featured"
      style={style}
      {...revealAttr}
    >
      <div className="k-card-media">
        <EventImage event={event} priority={index === 0} />
        <span className="k-tag">{event.category}</span>
        <StateTag event={event} />
        <SeatsTag event={event} />
      </div>
      <div className="k-card-body">
        <div className="k-card-date">
          <DateLeaf value={event.starts_at} />
          <span className="k-card-date-text">
            <b>{dateLabel(event.starts_at, { weekday: "long" })}</b>
            <span>בשעה {timeLabel(event.starts_at)}</span>
          </span>
        </div>
        <h3>{event.title}</h3>
        {event.subtitle && <p className="k-card-sub">{event.subtitle}</p>}
        <p className="k-facts">
          <span>
            <MapPin size={15} /> {event.location}
          </span>
          <Price price={event.price} />
        </p>
        <span className="k-card-cta">
          אני באה <ArrowUpLeft size={18} />
        </span>
      </div>
    </Link>
  );
}
