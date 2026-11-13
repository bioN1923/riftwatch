import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
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
  const m = data.movers;
  if (!m || !data.patch) return null;
  const [all, setAll] = useState(false);
  // Kept in the server's order: by the change we can be fairly sure of, so a big swing on few games
  // doesn't jump ahead of a smaller, solid one.
  const pick = (list: PatchMover[]) => list.filter((x) => role === 'ALL' || x.role === role).slice(0, 5);
  const up = pick(m.up);
  const down = pick(m.down);
  if (!up.length && !down.length) return null;
  return (
    <section aria-labelledby="movers-h" className="mt-6">
      <h2 id="movers-h" className="font-display text-xl font-bold">
        {t('mv.title', { from: m.against, to: data.patch })}
      </h2>
      <p className="text-xs text-muted">{t('mv.sub')}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Column title={t('mv.up')} icon={<TrendingUp className="size-4 text-win" aria-hidden />} list={up} group={group} all={all} />
        <Column title={t('mv.down')} icon={<TrendingDown className="size-4 text-loss" aria-hidden />} list={down} group={group} all={all} />
      </div>
      {(up.length > 3 || down.length > 3) && (
        <button onClick={() => setAll((v) => !v)} aria-expanded={all} className="mt-2 text-sm font-medium text-gold hover:underline sm:hidden">
          {all ? t('mv.fewer') : t('mv.all')}
        </button>
      )}
    </section>
  );
}

function Column({ title, icon, list, group, all }: { title: string; icon: ReactNode; list: PatchMover[]; group: string; all: boolean }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  return (
    <div className="panel p-3">
      <h3 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-semibold">
        {icon}
        {title}
      </h3>
      {list.length === 0 ? (
        <p className="px-1 py-2 text-sm text-faint">{t('mv.none')}</p>
      ) : (
        <ol className="space-y-0.5">
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
