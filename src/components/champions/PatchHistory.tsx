import clsx from 'clsx';
import type { Rated } from '../../../shared/types';
import { pct, thousands } from '../../lib/format';
import { t } from '../../i18n';

/** The same champion and role over the patches Riftwatch keeps, with a plain verdict on the latest change. */
export function PatchHistory({ history, current }: { history?: (Rated & { patch: string; pickRate?: number })[]; current: string | null }) {
  const h = history ?? [];
  if (h.length < 2) return null;
  const MIN = 20;
  const hasPick = h.some((x) => x.pickRate != null);
  const [prev, last] = h.slice(-2);
  // Same bar as Patch movers: a change counts only beyond twice its standard error, on enough games.
  const se = Math.sqrt(0.25 / prev.games + 0.25 / last.games);
  const delta = last.winRate - prev.winRate;
  const verdict =
    prev.games < MIN || last.games < MIN
      ? t('ph.few')
      : Math.abs(delta) > 2 * se
        ? t(delta > 0 ? 'ph.up' : 'ph.down', { points: (Math.abs(delta) * 100).toFixed(1), from: prev.patch })
        : t('ph.same', { from: prev.patch });
  return (
    <section className="panel p-4" aria-labelledby="ph-h">
      <h2 id="ph-h" className="panel-title">
        {t('ph.title')}
      </h2>
      <p className="mt-1 text-sm">{verdict}</p>
      <table className="mt-2 w-full text-sm">
        <caption className="sr-only">{hasPick ? t('ph.caption') : t('ph.captionGames')}</caption>
        <thead className="text-xs text-muted">
          <tr>
            <th scope="col" className="py-1 text-left font-medium">{t('ph.patch')}</th>
            <th scope="col" className="py-1 text-right font-medium">{t('tl.col.wr')}</th>
            {hasPick && <th scope="col" className="py-1 text-right font-medium">{t('tl.col.pick')}</th>}
            <th scope="col" className="py-1 text-right font-medium">{t('tl.col.games')}</th>
          </tr>
        </thead>
        <tbody>
          {h.map((x) => (
            <tr key={x.patch} className={clsx('border-t border-line', x.patch === current && 'font-semibold')} aria-current={x.patch === current ? 'true' : undefined}>
              <th scope="row" className="py-1 text-left font-normal">{x.patch}</th>
              <td className={clsx('num py-1 text-right', x.games < MIN && 'text-faint')}>
                {pct(x.winRate, 1)}
                {x.games < MIN && '*'}
              </td>
              {hasPick && <td className="num py-1 text-right text-muted">{x.pickRate != null ? pct(x.pickRate, 1) : ''}</td>}
              <td className="num py-1 text-right text-muted">{thousands(x.games)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {h.some((x) => x.games < MIN) && <p className="mt-2 text-[11px] text-faint">{t('ph.note', { n: MIN })}</p>}
    </section>
  );
}

