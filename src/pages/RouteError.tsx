import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { AlertTriangle } from 'lucide-react';

/** Shown when a page crashes or fails to load, instead of a blank screen. */
export function RouteError() {
  const error = useRouteError();
  const chunkFailed = error instanceof Error && /dynamically imported module|Loading chunk/i.test(error.message);
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : chunkFailed
      ? 'A newer version of the site is available. Reload to get it.'
      : error instanceof Error
        ? error.message
        : 'Something unexpected happened.';
  if (error) console.error(error);
  return (
    <div role="alert" className="mx-auto max-w-lg px-4 py-24 text-center">
      <AlertTriangle className="mx-auto size-9 text-kda-great" aria-hidden />
      <h1 className="mt-4 font-display text-3xl font-bold">This page hit a problem</h1>
      <p className="mt-2 text-muted">{message}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={() => window.location.reload()} className="rounded bg-gold px-4 py-2 font-semibold text-gold-ink hover:brightness-110">
          Reload the page
        </button>
        <Link to="/" className="rounded border border-line-strong px-4 py-2 font-semibold hover:bg-raised">
          Go to search
        </Link>
      </div>
    </div>
  );
}
