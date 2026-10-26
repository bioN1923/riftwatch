import { Link } from 'react-router';
import { useEffect } from 'react';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found — Riftwatch';
  }, []);
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">This page doesn’t exist</h1>
      <p className="mt-2 text-muted">The link may be broken or the URL mistyped.</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-gold px-4 py-2 font-semibold text-gold-ink">
        Search for a player
      </Link>
    </div>
  );
}
