import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
export const dynamic = "force-dynamic";
export default async function Login() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main id="main" className="login-main">
      <span className="eyebrow">BEHIND THE GOOD MOMENTS</span>
      <h1>טוב שאת כאן.</h1>
      <p>כל האירועים, כל המשתתפות, במקום אחד.</p>
      <LoginForm />
    </main>
  );
}
