"use client";
import { appPath } from "@/lib/paths";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <form
      method="post"
      className="login-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const password = new FormData(e.currentTarget).get("password");
        try {
          const r = await fetch(appPath("/api/auth/login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          });
          const data = await r.json();
          if (!r.ok) throw Error(data.error);
          router.replace("/admin");
          router.refresh();
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "לא הצלחנו להתחבר. נסי שוב.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <span className="login-lock">
        <LockKeyhole size={24} />
      </span>
      <label>
        הסיסמה שלך
        <div className="password-input">
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={200}
          />
          <button
            type="button"
            className="icon-button"
            aria-label={show ? "הסתרת סיסמה" : "הצגת סיסמה"}
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      <p className="field-hint">נשארת מחוברת בטלפון הזה 30 יום.</p>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <button
        className="button gold-button full-width"
        disabled={!ready || busy}
      >
        {busy ? "נכנסת…" : "כניסה לניהול"}
        <ArrowLeft size={18} />
      </button>
    </form>
  );
}
