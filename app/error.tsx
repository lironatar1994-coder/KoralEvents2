"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="empty-public">
      <h1>משהו קטן השתבש.</h1>
      <p>לא הצלחנו לטעון את העמוד. אפשר לנסות שוב.</p>
      <button className="button gold-button" onClick={reset}>
        ניסיון נוסף
      </button>
    </main>
  );
}
