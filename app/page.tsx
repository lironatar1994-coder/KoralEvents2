import Link from "next/link";
import { ArrowUpLeft, ArrowDown, MapPin, Sparkles } from "lucide-react";
import { getEvents } from "@/lib/events";
import { dateLabel, timeLabel } from "@/lib/types";
import { Header, Footer, EventCard, EventImage } from "@/components/Public";

export const dynamic = "force-dynamic";

export default async function Home() {
  const events = await getEvents();
  const featured = events[0];
  return (
    <div className="public-site">
      <Header />
      <main id="main">
        <section
          className={`show-hero ${featured?.image_mode === "contain" ? "show-hero-flyer" : ""}`}
        >
          {featured && (
            <div className="show-hero-image">
              <EventImage event={featured} priority />
            </div>
          )}
          <div className="show-hero-shade" />
          <div className="show-hero-content page-width">
            <div className="show-kicker">
              <span className="live-dot" /> לילות. מסיבות. חוויות.{" "}
              <span className="kicker-divider" /> לנשים בלבד
            </div>
            <h1>
              יוצאות.
              <br />
              <span>מרגישות.</span>
              <br />
              זוכרות<span className="hero-period">.</span>
            </h1>
            <p>רגעים שנשארים. הרבה אחרי שהלילה נגמר.</p>
            <a href="#events" className="button show-button">
              הלילה הבא שלי <ArrowDown size={20} />
            </a>
          </div>
          <span className="hero-side-note" aria-hidden="true">
            GOOD NIGHTS. GREAT MEMORIES.
          </span>
          <span className="hero-spark" aria-hidden="true">
            ✳
          </span>
          {featured && (
            <Link
              className="next-event-ticket page-width"
              href={`/events/${featured.id}`}
            >
              <div className="ticket-label">
                <span className="live-dot" /> על הפרק
                <span dir="ltr">UP NEXT / 01</span>
              </div>
              <div className="ticket-title">
                <span>{featured.category}</span>
                <h2>{featured.title}</h2>
              </div>
              <div className="ticket-facts">
                <span>
                  {dateLabel(featured.starts_at)} ·{" "}
                  {timeLabel(featured.starts_at)}
                </span>
                <span>
                  <MapPin size={14} /> {featured.location}
                </span>
              </div>
              <span className="ticket-cta">
                אני באה <ArrowUpLeft size={25} />
              </span>
            </Link>
          )}
        </section>
        <div className="show-ribbon" aria-hidden="true">
          <span>לצאת מהשגרה</span>
          <span>✳</span>
          <span>להיכנס לרגע</span>
          <span>✳</span>
          <span>להיות ביחד</span>
          <span>✳</span>
          <span className="ribbon-extra">MAKE IT A NIGHT</span>
        </div>
        <section className="show-events" id="events">
          <div className="page-width">
            <div className="section-heading">
              <div>
                <div className="eyebrow">תפני לך ערב</div>
                <h2>
                  זה הזמן <span>שלך.</span>
                </h2>
              </div>
              <span className="event-count">
                <b>{events.length.toString().padStart(2, "0")}</b> אירועים
                קרובים
              </span>
            </div>
            {events.length ? (
              <div
                className={`event-grid ${events.length === 2 ? "two-events" : ""}`}
              >
                {events.map((event, index) => (
                  <EventCard key={event.id} event={event} index={index} />
                ))}
              </div>
            ) : (
              <div className="empty-public">
                <Sparkles size={40} />
                <h3>הלילה הבא כבר בדרך.</h3>
                <p>האירועים הקרובים יופיעו כאן בקרוב.</p>
              </div>
            )}
          </div>
        </section>
        <section id="about" className="show-about">
          <div className="page-width">
            <span className="about-orbit" aria-hidden="true">
              ✳
            </span>
            <div className="show-about-copy">
              <div className="eyebrow">KORAL EVENTS / הביחד שלנו</div>
              <h2>
                פחות שגרה.
                <br />
                <span>יותר חיים.</span>
              </h2>
              <p>
                מסיבות, ערבים וטיולי לילה לנשים בלבד.
                <br />
                ללא מטרות רווח. עם כל הלב.
              </p>
              <a href="#events" className="text-link">
                נתראה באירוע הבא <ArrowUpLeft size={20} />
              </a>
            </div>
            <span className="about-signoff" aria-hidden="true">
              See you
              <br />
              <em>there.</em>
            </span>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
