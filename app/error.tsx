"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="public-site">
      <main id="main" className="k-simple">
        <h1>משהו קטן השתבש.</h1>
        <p>העמוד לא נטען. נסי שוב, זה בדרך כלל עובר.</p>
        <button className="k-btn k-btn-rose" onClick={reset}>
          לנסות שוב
        </button>
      </main>
    </div>
  );
}
