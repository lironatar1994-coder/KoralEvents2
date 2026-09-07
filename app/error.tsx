"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="empty-public">
      <h1>משהו קטן השתבש.</h1>
      <p>העמוד לא נטען. נסי שוב, זה בדרך כלל עובר.</p>
      <button className="button gold-button" onClick={reset}>
        לנסות שוב
      </button>
    </main>
  );
}
