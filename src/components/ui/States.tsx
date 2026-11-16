import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, SearchX, KeyRound, Timer, EyeOff } from 'lucide-react';
import { ApiClientError } from '../../lib/api';
import { getLang, t } from '../../i18n';

export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ''}`} aria-hidden="true" />;
}

/** Automatic retries after a rate limit, per error panel: enough to ride out a short pause, not enough to hammer a shared key. */
export const AUTO_RETRIES = 2;

/** Seconds to wait before retrying: the server's Retry-After when it sent one, kept between 3 s and a minute. */
export function retryDelay(retryAfter?: number) {
  return Math.min(60, Math.max(3, Math.ceil(retryAfter ?? 10)));
}

/**
 * Automatic retries used per page. Kept outside the component: a retry can show the loading
 * skeleton and mount a fresh error panel, which must not start counting from zero again.
 */
const autoUsed = new Map<string, { n: number; at: number }>();
const USED_FOR_MS = 2 * 60_000;

function usedHere(key: string) {
  const u = autoUsed.get(key);
  return u && Date.now() - u.at < USED_FOR_MS ? u.n : 0;
}

/**
 * Counts down and calls `onRetry` when a rate-limited request may be tried again, at most
 * AUTO_RETRIES times per page within a couple of minutes. Returns the seconds left, or null.
 */
function useAutoRetry(e: ApiClientError | null, onRetry?: () => void) {
  const [left, setLeft] = useState<number | null>(null);
  const retry = useRef(onRetry);
  retry.current = onRetry;
  const key = typeof location === 'undefined' ? '' : location.pathname + location.search;
  const active = !!onRetry && e?.code === 'RATE_LIMITED' && usedHere(key) < AUTO_RETRIES;
  useEffect(() => {
    if (!active) return setLeft(null);
    let n = retryDelay(e?.retryAfter);
    setLeft(n);
    const id = setInterval(() => {
      n -= 1;
      if (n > 0) return setLeft(n);
      clearInterval(id);
      autoUsed.set(key, { n: usedHere(key) + 1, at: Date.now() });
      setLeft(null);
      retry.current?.();
    }, 1000);
    return () => clearInterval(id);
    // A new error object (the retry failed again) starts a new countdown, if any are left.
  }, [e, active, key]);
  return left;
}

export function ErrorState({ error, action, page, title: titleOverride, onRetry }: { error: unknown; action?: ReactNode; page?: boolean; title?: string; onRetry?: () => void }) {
  const e = error instanceof ApiClientError ? error : null;
  const left = useAutoRetry(e, onRetry);
  const Icon = e?.code === 'PRIVATE' ? EyeOff : e?.code === 'NOT_FOUND' ? SearchX : e?.code === 'KEY_INVALID' ? KeyRound : e?.code === 'RATE_LIMITED' ? Timer : AlertTriangle;
  const title =
    titleOverride ??
    (e?.code === 'PRIVATE' ? t('error.PRIVATE.title') : e?.code === 'NOT_FOUND' ? t('error.NOT_FOUND.title') : e?.code === 'KEY_INVALID' ? t('error.KEY_INVALID.title') : e?.code === 'RATE_LIMITED' ? t('error.RATE_LIMITED.title') : t('error.generic.title'));
  // The server explains errors in English; other languages get the translated explanation for the error type.
  const message = e
    ? e.status === 0 && getLang() !== 'en'
      ? t('error.offline.body')
      : getLang() === 'en'
      ? e.message
      : t(`error.${e.code}.body` as 'error.NOT_FOUND.body')
    : error instanceof Error && getLang() === 'en'
      ? error.message
      : t('error.generic.body');
  return (
    <div role="alert" className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
      <Icon className="size-8 text-muted" aria-hidden />
      {page ? <h1 className="font-display text-2xl font-bold">{title}</h1> : <h2 className="font-display text-xl font-semibold">{title}</h2>}
      <p className="max-w-md text-muted">{message}</p>
      {left != null && (
        <p className="num text-sm text-muted" aria-live="polite">
          {t('error.retryIn', { count: left })}
        </p>
      )}
      {/* Retrying can't help with a private profile; offer the owner the way back instead. */}
      {e?.code === 'PRIVATE' ? (
        <Link to="/privacy#visibility" className="text-sm font-medium text-gold hover:underline">
          {t('error.PRIVATE.yours')}
        </Link>
      ) : (
        (action ??
        (onRetry && (
          <button onClick={onRetry} className="rounded border border-line-strong px-4 py-2 font-semibold hover:bg-raised">
            {t('common.tryAgain')}
          </button>
        )))
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="max-w-sm text-muted">{children}</div>}
    </div>
  );
}
