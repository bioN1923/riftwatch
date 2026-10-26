import type { ReactNode } from 'react';
import { AlertTriangle, SearchX, KeyRound, Timer } from 'lucide-react';
import { ApiClientError } from '../../lib/api';

export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ''}`} aria-hidden="true" />;
}

export function ErrorState({ error, action }: { error: unknown; action?: ReactNode }) {
  const e = error instanceof ApiClientError ? error : null;
  const Icon = e?.code === 'NOT_FOUND' ? SearchX : e?.code === 'KEY_INVALID' ? KeyRound : e?.code === 'RATE_LIMITED' ? Timer : AlertTriangle;
  const title =
    e?.code === 'NOT_FOUND'
      ? 'Player not found'
      : e?.code === 'KEY_INVALID'
        ? 'The API key needs renewing'
        : e?.code === 'RATE_LIMITED'
          ? 'Too many requests right now'
          : 'Couldn’t load this';
  const message = e?.message ?? (error instanceof Error ? error.message : 'Something went wrong.');
  return (
    <div role="alert" className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
      <Icon className="size-8 text-muted" aria-hidden />
      <h2 className="font-display text-xl font-semibold">{title}</h2>
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
