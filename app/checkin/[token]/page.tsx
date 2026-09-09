import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowUpLeft, ShieldCheck } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import { getTicket } from "@/lib/events";
import { Brand } from "@/components/Brand";
import { CheckIn } from "@/components/CheckIn";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "בדיקת כניסה",
  robots: { index: false, follow: false },
};
/*
 * The link inside every QR. Anyone can scan it, so it shows nothing until
 * the phone is signed in to the management app: the door is the manager or
 * someone she trusts with her login.
 */
export default async function CheckInPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();
  if (!(await isAdmin()))
    redirect(`/admin/login?next=${encodeURIComponent(`/checkin/${token}`)}`);
  const ticket = await getTicket(token);
  if (!ticket) notFound();
  return (
    <div className="public-site ticket-page checkin-page">
      <div className="ticket-sky" aria-hidden="true" />
      <main id="main" className="ticket-main">
        <Brand small />
        <p className="ticket-kicker">
          <ShieldCheck size={14} /> בדיקת כניסה
        </p>
        <CheckIn initial={ticket} />
        <div className="ticket-actions">
          <Link
            className="k-btn k-btn-ghost"
            href={`/admin/events/${ticket.event.id}`}
          >
            לרשימת המשתתפות <ArrowUpLeft size={17} />
          </Link>
        </div>
      </main>
    </div>
  );
}
