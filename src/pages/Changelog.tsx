import { useEffect, useState } from 'react';
import { CHANGELOG, newerThan } from '../data/changelog';
import { getSeenVersion, setSeenVersion } from '../lib/storage';
import { getLang, t } from '../i18n';

/** What changed on Riftwatch, newest first (English, like the API usage page). */
export function ChangelogPage() {
  // What was new when the page opened stays marked while you read; leaving counts as seen.
  const [seen] = useState(getSeenVersion);
  useEffect(() => {
    document.title = `${t('cl.title')} · Riftwatch`;
    setSeenVersion(CHANGELOG[0].version);
  }, []);
  const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(getLang(), { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{t('cl.title')}</h1>
      <p className="mt-3 text-muted">{t('cl.lead')}</p>
      {getLang() !== 'en' && <p className="mt-4 rounded border border-line bg-surface px-4 py-3 text-sm text-muted">{t('pv.englishOnly')}</p>}
      <ol className="mt-8 space-y-6 border-l border-line pl-6">
        {CHANGELOG.map((e) => (
          <li key={e.version} className="relative">
            <span className="absolute -left-[29px] top-1.5 size-2.5 rounded-full bg-gold" aria-hidden />
            <h2 className="flex items-baseline gap-3">
              <span className="font-display text-xl font-bold">v{e.version}</span>
              <time dateTime={e.date} className="text-xs text-muted">
                {day(e.date)}
              </time>
              {seen && newerThan(e.version, seen) && (
                <span className="rounded-full border border-gold px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold">{t('cl.new')}</span>
              )}
            </h2>
            <ul lang="en" className="mt-1.5 list-disc space-y-1 pl-5 leading-relaxed text-muted">
              {e.items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </article>
  );
}
