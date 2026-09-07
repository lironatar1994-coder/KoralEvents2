import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
export const dynamic = "force-dynamic";
export default async function Login() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main id="main" className="login-main">
      <h1>טוב שאת כאן.</h1>
      <p>האירועים והמשתתפות, במקום אחד.</p>
      <LoginForm />
    </main>
  );
}
