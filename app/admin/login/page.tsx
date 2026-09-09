import { redirect } from "next/navigation";
import { isAdmin, safeNext } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = safeNext((await searchParams).next);
  if (await isAdmin()) redirect(next);
  const door = next.startsWith("/checkin/");
  return (
    <main id="main" className="login-main">
      <h1>{door ? "בדיקת כרטיס בכניסה." : "טוב שאת כאן."}</h1>
      <p>
        {door
          ? "כדי לאשר כניסה עם QR צריך להיות מחוברות לניהול. אחרי הכניסה נחזור לכרטיס."
          : "האירועים והמשתתפות, במקום אחד."}
      </p>
      <LoginForm next={next} />
    </main>
  );
}
