import { ArrowUpLeft, ArrowDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { getEvents } from "@/lib/events";
import { dateLabel } from "@/lib/types";
import { Header, Footer, EventCard } from "@/components/Public";
import { HeroSlides } from "@/components/HeroSlides";

export const dynamic = "force-dynamic";

const ribbon = ["לצאת מהשגרה", "להיכנס לרגע", "להיות ביחד"];

export default async function Home() {
  const events = await getEvents();
  const featured = events[0];
  return (
    <div className="public-site">
      <Header />
      <main id="main">
        <section className="show-hero">
          <div className="show-hero-image">
            <HeroSlides />
          </div>
          <div className="show-hero-shade" />
          <div className="show-hero-content page-width">
            <div className="show-kicker">
              <span className="live-dot" /> לילות. מסיבות. חוויות.{" "}
              <span className="kicker-divider" /> לנשים בלבד
            </div>
            <div className="hero-spacer" aria-hidden="true" />
            <h1>
              יוצאות.
              <br />
              <span>מרגישות.</span>
              <br />
              זוכרות<span className="hero-period">.</span>
            </h1>
            {featured && (
              <Link className="hero-next" href={`/events/${featured.id}`}>
                <b>הלילה הבא</b>
                <span>
                  {featured.title} ·{" "}
                  {dateLabel(featured.starts_at, { weekday: "long" })}
                </span>
              </Link>
            )}
            <a href="#events" className="button show-button">
              הלילה הבא שלי <ArrowDown size={20} />
            </a>
          </div>
        </section>
        <div className="show-ribbon" aria-hidden="true">
          <div className="ribbon-track">
            {[...ribbon, ...ribbon, ...ribbon, ...ribbon].map((text, i) => (
              <span key={i}>
                {text} <b>✳</b>
              </span>
            ))}
          </div>
        </div>
        <section className="show-events" id="events">
          <div className="page-width">
            <div className="section-heading">
              <h2>
                הערבים <span>הקרובים.</span>
              </h2>
            </div>
            {events.length ? (
              <div className="event-list">
                {events.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={index}
                    variant={index === 0 ? "featured" : "compact"}
                  />
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
            <div className="show-about-copy">
              <div className="eyebrow">הביחד שלנו</div>
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
