import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CHANGELOG, newerThan, type ChangelogEntry } from '../data/changelog';
import { getSeenVersion, setSeenVersion } from '../lib/storage';
import { getLang, t } from '../i18n';

/** Versions shown before "show older"; each click adds this many more. */
const PER_PAGE = 12;

/** What changed on Riftwatch, newest first (English, like the API usage page), grouped by day. */
export function ChangelogPage() {
  // What was new when the page opened stays marked while you read; leaving counts as seen.
  const [seen] = useState(getSeenVersion);
  useEffect(() => {
    document.title = `${t('cl.title')} · Riftwatch`;
    setSeenVersion(CHANGELOG[0].version);
  }, []);
  const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(getLang(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Always show every version you haven't seen yet, and at least PER_PAGE.
  const unseen = seen ? CHANGELOG.filter((e) => newerThan(e.version, seen)).length : 0;
  const [shown, setShown] = useState(() => Math.max(PER_PAGE, unseen));
  // Many versions ship on the same day, so one heading per day instead of the date on every entry.
  const days = useMemo(() => {
    const out: { date: string; entries: ChangelogEntry[] }[] = [];
    for (const e of CHANGELOG.slice(0, shown)) {
      const last = out[out.length - 1];
      if (last && last.date === e.date) last.entries.push(e);
      else out.push({ date: e.date, entries: [e] });
    }
    return out;
  }, [shown]);
  const perDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of CHANGELOG) m.set(e.date, (m.get(e.date) ?? 0) + 1);
    return m;
  }, []);
  const hiddenVersions = CHANGELOG.length - shown;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{t('cl.title')}</h1>
      <p className="mt-3 text-muted">{t('cl.lead')}</p>
      {getLang() !== 'en' && <p className="mt-4 rounded border border-line bg-surface px-4 py-3 text-sm text-muted">{t('pv.englishOnly')}</p>}
      <div className="mt-8 space-y-10">
        {days.map((d) => (
          <section key={d.date} aria-labelledby={`cl-${d.date}`}>
            <h2 id={`cl-${d.date}`} className="flex items-baseline gap-3 border-b border-line pb-2">
              <time dateTime={d.date} className="font-display text-2xl font-bold">
                {day(d.date)}
              </time>
              <span className="text-xs text-muted">{t('cl.updates', { count: perDay.get(d.date) ?? d.entries.length })}</span>
            </h2>
            <ol className="mt-4 space-y-4 border-l border-line pl-6">
              {d.entries.map((e) => (
                <li key={e.version} className="relative">
                  <span className="absolute -left-[29px] top-1.5 size-2.5 rounded-full bg-gold" aria-hidden />
                  <h3 className="flex items-baseline gap-3">
                    <span className="font-display text-lg font-bold">v{e.version}</span>
                    {seen && newerThan(e.version, seen) && (
                      <span className="rounded-full border border-gold px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold">{t('cl.new')}</span>
                    )}
                  </h3>
                  <ul lang="en" className="mt-1 list-disc space-y-1 pl-5 leading-relaxed text-muted">
                    {e.items.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      {hiddenVersions > 0 && (
        <button
          onClick={() => setShown((n) => n + PER_PAGE * 2)}
          className="mt-8 inline-flex min-h-[24px] items-center gap-1.5 rounded border border-line px-3 py-2 text-sm text-muted hover:border-gold/60 hover:text-text"
        >
          <ChevronDown className="size-4" aria-hidden />
          {t('cl.older', { count: hiddenVersions })}
        </button>
      )}
    </article>
  );
}
