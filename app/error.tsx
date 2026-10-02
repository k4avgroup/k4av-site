'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="container page-intro">
      <span className="eyebrow">Temporary interruption</span>
      <h1>Let’s try that again.</h1>
      <p>This page couldn’t load. Your request has not been confirmed.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
