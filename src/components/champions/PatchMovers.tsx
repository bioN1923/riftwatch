import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import clsx from 'clsx';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { PatchMover, TierList } from '../../../shared/types';
import { assets, champSlug, useStaticData } from '../../lib/ddragon';
import { pct, thousands } from '../../lib/format';
import { GameImg } from '../ui/GameImg';
import { ROLE_LABEL, RoleIcon } from '../ui/RoleIcon';
import { t } from '../../i18n';

/** Champions whose win rate rose or fell most since the previous patch. */
export function PatchMovers({ data, role, group }: { data: TierList; role: string; group: string }) {
  // Hooks first: the early returns below must not change how many hooks run.
  const [all, setAll] = useState(false);
  const { hash } = useLocation();
  const m = data.movers;
  const shown = !!m && !!data.patch;
  // Arriving from the home page's "All changes" link: bring this section into view once it exists.
  useEffect(() => {
    if (hash !== '#movers' || !shown) return;
    const go = () => document.getElementById('movers')?.scrollIntoView({ block: 'start' });
    go();
    // Again once the rows above (free rotation, filters) have settled, as profile deep links do.
    const id = globalThis.setTimeout(go, 300);
    return () => globalThis.clearTimeout(id);
  }, [hash, shown]);
  if (!m || !data.patch) return null;
  // Kept in the server's order: by the change we can be fairly sure of, so a big swing on few games
  // doesn't jump ahead of a smaller, solid one.
  const pick = (list: PatchMover[]) => list.filter((x) => role === 'ALL' || x.role === role).slice(0, 5);
  const up = pick(m.up);
  const down = pick(m.down);
  if (!up.length && !down.length) return null;
  return (
    <section id="movers" aria-labelledby="movers-h" className="mt-6 scroll-mt-20">
      <h2 id="movers-h" className="font-display text-xl font-bold">
        {t('mv.title', { from: m.against, to: data.patch })}
      </h2>
      <p className="text-xs text-muted">{t('mv.sub')}</p>
      {/* One side empty: no whole panel just to say "no big changes"; the other side takes the row and a line notes the quiet one. */}
      <div className={clsx('mt-3 grid gap-3', up.length && down.length && 'md:grid-cols-2')}>
        {up.length > 0 && <Column title={t('mv.up')} icon={<TrendingUp className="size-4 text-win" aria-hidden />} list={up} group={group} all={all} wide={!down.length} />}
        {down.length > 0 && <Column title={t('mv.down')} icon={<TrendingDown className="size-4 text-loss" aria-hidden />} list={down} group={group} all={all} wide={!up.length} />}
      </div>
      {(!up.length || !down.length) && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          {up.length ? <TrendingDown className="size-3.5 text-loss" aria-hidden /> : <TrendingUp className="size-3.5 text-win" aria-hidden />}
          {up.length ? t('mv.noneDown') : t('mv.noneUp')}
        </p>
      )}
      {(up.length > 3 || down.length > 3) && (
        <button onClick={() => setAll((v) => !v)} aria-expanded={all} className="mt-2 text-sm font-medium text-gold hover:underline sm:hidden">
          {all ? t('mv.fewer') : t('mv.all')}
        </button>
      )}
    </section>
  );
}

function Column({ title, icon, list, group, all, wide }: { title: string; icon: ReactNode; list: PatchMover[]; group: string; all: boolean; wide?: boolean }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  return (
    <div className="panel p-3">
      <h3 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-semibold">
        {icon}
        {title}
      </h3>
      {(
        <ol className={clsx(wide ? 'grid gap-x-6 gap-y-0.5 md:grid-cols-2' : 'space-y-0.5')}>
          {list.map((x, i) => {
            const c = a.champion(x.championId);
            const slug = sd?.champions.get(x.championId)?.id;
            const q = new URLSearchParams();
            if (group !== 'ranked') q.set('queue', group);
            else if (x.role !== 'ALL') q.set('role', x.role);
            return (
              // On phones only the top three show until "show all", so the tier list isn't pushed off screen.
              <li key={`${x.championId}-${x.role}`} className={clsx(i >= 3 && !all && 'hidden sm:block')}>
                <Link
                  to={slug ? `/champions/${champSlug(slug)}${q.size ? `?${q}` : ''}` : '#'}
                  className="grid grid-cols-[32px_minmax(0,1fr)_auto_auto] items-center gap-2.5 rounded px-1 py-1.5 transition-colors hover:bg-raised"
                >
                  <GameImg src={c.url} alt="" size={32} rounded="sm" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {c.name}
                      {x.role !== 'ALL' && <span title={ROLE_LABEL[x.role]} className="shrink-0 text-faint"><RoleIcon role={x.role} size={13} /></span>}
                    </span>
                    <span className="num block text-[11px] text-muted">{t('mv.was', { from: pct(x.prevWinRate, 1), to: pct(x.winRate, 1) })}</span>
                  </span>
                  <span className="num hidden text-xs text-faint sm:block" title={t('mv.gamesTip')}>
                    {thousands(x.prevGames)} → {t('common.games', { count: x.games })}
                  </span>
                  <span className={clsx('num w-14 text-right text-sm font-bold', x.delta > 0 ? 'text-win' : 'text-loss')}>
                    {x.delta > 0 ? '+' : '−'}
                    {pct(Math.abs(x.delta), 1)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
