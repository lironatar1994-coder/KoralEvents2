import { ArrowDown, ArrowUpLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { getEvents } from "@/lib/events";
import { dateLabel, timeLabel } from "@/lib/types";
import {
  Header,
  Footer,
  EventCard,
  DateLeaf,
  countdownLabel,
} from "@/components/Public";
import { Spark } from "@/components/Brand";
import { HeroSlides } from "@/components/HeroSlides";
import { ScrollReveal } from "@/components/ScrollReveal";

export const dynamic = "force-dynamic";

const ribbon = [
  "ערבי נשים",
  "לילות בכותל",
  "שיעורי תורה",
  "הפרשות חלה",
  "ערבי העצמה",
  "מסיבות פורים",
  "טיולי לילה",
];

const steps = [
  {
    title: "נרשמות",
    text: "בשם ובטלפון בלבד. בלי סיסמאות, בלי תשלום באתר.",
  },
  {
    title: "המנהלת מאשרת",
    text: "עוברת על הבקשה וחוזרת אלייך בהודעה או בטלפון.",
  },
  {
    title: "המקום שלך שמור",
    text: "מוסיפות ליומן, מביאות חברה, ונפגשות.",
  },
];

export default async function Home() {
  const events = await getEvents();
  const [featured, ...rest] = events;
  const openCount = events.filter((e) => e.state === "published").length;
  return (
    <div className="public-site">
      <Header />
      <main id="main">
        <section className="k-hero">
          <HeroSlides />
          <div className="k-hero-shade" aria-hidden="true" />
          <div className="k-grain" aria-hidden="true" />
          <div className="k-wrap k-hero-body">
            <div className="k-hero-copy">
              <p className="k-kicker">
                <i aria-hidden="true" /> ערבי נשים · ללא מטרות רווח
              </p>
              <h1 className="k-hero-title">
                <span className="hero-line k-hero-intro">
                  <span>״אישה לאישה</span>
                </span>
                <span className="hero-line k-hero-word">
                  <span>
                    מלכה
                    <i className="k-quote">״</i>
                  </span>
                </span>
              </h1>
              <span className="k-hero-flourish" aria-hidden="true">
                <svg viewBox="0 0 320 26" preserveAspectRatio="none">
                  <path d="M3 18 C 60 4, 110 26, 170 12 S 270 4, 317 10" />
                </svg>
              </span>
              <p className="k-hero-sub">ערבי נשים לזיכוי הרבות.</p>
              <div className="k-hero-actions">
                <a href="#events" className="k-btn k-btn-rose k-btn-down">
                  הערב הבא שלנו <ArrowDown size={20} />
                </a>
                <a href="#about" className="k-btn k-btn-ghost">
                  מי אנחנו
                </a>
              </div>
            </div>
            {featured && (
              <Link className="k-ticket" href={`/events/${featured.id}`}>
                <DateLeaf value={featured.starts_at} className="on-night" />
                <span className="k-ticket-body">
                  <span className="k-ticket-label">
                    הערב הבא · {countdownLabel(featured.starts_at)}
                  </span>
                  <span className="k-ticket-title">{featured.title}</span>
                  <span className="k-ticket-meta">
                    {dateLabel(featured.starts_at, { weekday: "long" })} ·{" "}
                    {timeLabel(featured.starts_at)} · {featured.location}
                  </span>
                </span>
                <span className="k-ticket-arrow" aria-hidden="true">
                  <ArrowUpLeft size={20} />
                </span>
              </Link>
            )}
          </div>
          <div className="k-hero-foot" aria-hidden="true">
            <span className="k-scroll-cue">
              <i /> גללי למטה
            </span>
            <span className="latin">women only · from the heart</span>
          </div>
        </section>

        <div className="k-ribbon" aria-hidden="true">
          <div className="k-ribbon-track">
            {[...ribbon, ...ribbon, ...ribbon, ...ribbon].map((text, i) => (
              <span key={i}>
                {text} <Spark />
              </span>
            ))}
          </div>
        </div>

        <section className="k-events" id="events">
          <div className="k-wrap">
            <header className="k-section-head" data-reveal>
              <h2>
                הערבים <em>הקרובים</em>
              </h2>
              {openCount > 0 && (
                <p className="k-section-note">
                  {openCount === 1
                    ? "ערב אחד פתוח להרשמה"
                    : `${openCount} ערבים פתוחים להרשמה`}
                </p>
              )}
            </header>
            {featured ? (
              <>
                <EventCard
                  event={featured}
                  index={0}
                  variant="featured"
                  reveal
                />
                {rest.length > 0 && (
                  <div className="k-grid">
                    {rest.map((event, index) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        index={index + 1}
                        variant="compact"
                        reveal
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="k-empty" data-reveal>
                <Sparkles size={40} />
                <h3>הערב הבא כבר בדרך.</h3>
                <p>ברגע שייקבע תאריך, הוא יופיע כאן ראשון.</p>
              </div>
            )}
          </div>
        </section>

        <section id="about" className="k-about">
          <div className="k-grain" aria-hidden="true" />
          <div className="k-wrap k-about-grid">
            <div className="k-about-copy">
              <p className="k-eyebrow light" data-reveal>
                מי אנחנו
              </p>
              <h2 data-reveal>
                אנחנו <span className="latin">Koral Events</span>.
                <br />
                <em>ערבי נשים לזיכוי הרבות.</em>
              </h2>
              <p
                data-reveal
                style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
              >
                אירועים לנשים, ללא מטרות רווח. כל פעם מקום אחר וערב אחר, ומה
                שמשותף לכולם הוא הביחד: שיעור שנשאר איתך, שולחן שמתמלא, ולילה
                שמסתיים בחיוך.
              </p>
              <ul className="k-kinds" aria-label="סוגי האירועים שלנו">
                {[
                  "שיעורי תורה עם רבניות",
                  "מסיבות וערבי לילה",
                  "הפרשת חלה",
                  "ערבי העצמה נשית",
                  "לילות בכותל וטיולים",
                  "ועוד",
                ].map((kind, i) => (
                  <li
                    key={kind}
                    data-reveal
                    style={
                      {
                        "--reveal-delay": `${120 + i * 40}ms`,
                      } as React.CSSProperties
                    }
                  >
                    {kind}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <ol className="k-steps" aria-label="איך זה עובד">
                {steps.map((step, i) => (
                  <li
                    key={step.title}
                    data-reveal
                    style={
                      { "--reveal-delay": `${i * 90}ms` } as React.CSSProperties
                    }
                  >
                    <span aria-hidden="true">0{i + 1}</span>
                    <div>
                      <b>{step.title}</b>
                      <p>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <a href="#events" className="k-btn k-btn-rose" data-reveal>
                נתראה בערב הבא <ArrowUpLeft size={18} />
              </a>
            </div>
          </div>
          <span className="k-signoff" aria-hidden="true">
            See you there.
          </span>
        </section>
      </main>
      <Footer />
      <ScrollReveal />
    </div>
  );
}
