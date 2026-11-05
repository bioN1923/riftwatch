import type { ReactNode } from 'react';
import { AlertTriangle, SearchX, KeyRound, Timer } from 'lucide-react';
import { ApiClientError } from '../../lib/api';
import { getLang, t } from '../../i18n';

export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ''}`} aria-hidden="true" />;
}

export function ErrorState({ error, action, page, title: titleOverride }: { error: unknown; action?: ReactNode; page?: boolean; title?: string }) {
  const e = error instanceof ApiClientError ? error : null;
  const Icon = e?.code === 'NOT_FOUND' ? SearchX : e?.code === 'KEY_INVALID' ? KeyRound : e?.code === 'RATE_LIMITED' ? Timer : AlertTriangle;
  const title =
    titleOverride ??
    (e?.code === 'NOT_FOUND' ? t('error.NOT_FOUND.title') : e?.code === 'KEY_INVALID' ? t('error.KEY_INVALID.title') : e?.code === 'RATE_LIMITED' ? t('error.RATE_LIMITED.title') : t('error.generic.title'));
  // The server explains errors in English; other languages get the translated explanation for the error type.
  const message = e
    ? getLang() === 'en'
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
      {action}
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
