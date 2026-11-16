import { Link } from 'react-router';
import clsx from 'clsx';
import type { ChampionStats } from '../../../shared/types';
import { assets, champSlug, useStaticData } from '../../lib/ddragon';
import { decimal, pct, thousands, sureTone, placeTone } from '../../lib/format';
import { GameImg } from '../ui/GameImg';
import { ItemTip } from '../ui/ItemTip';
import { t } from '../../i18n';

/**
 * Arena on champion pages. Riot's policy: products may not show win rates for Augments or Arena
 * items. So this shows the champion's own results, finishing places, duo partners, and items by
 * how often they’re bought — never augment stats, and never item win rates.
 */
type Arena = NonNullable<ChampionStats['arena']>;

/** Placement, top-four rate and first-place rate, in the header strip of an Arena champion page. */
export function ArenaStrip({ s }: { s: ChampionStats }) {
  const sum = s.summary;
  const ar = s.arena;
  if (!sum || !ar) return <div className="mt-6" />;
  const items: [string, string, string?][] = [
    [t('arena.avgPlace'), decimal(ar.avgPlacement, 2), placeTone(ar.avgPlacement, sum.games)],
    [t('arena.top4'), pct(sum.winRate, 1), sureTone(sum.winRate, sum.games)],
    [t('arena.first'), pct(ar.firstRate, 1)],
    [t('cp.pickRate'), pct(sum.pickRate, 1)],
    [t('cp.games'), thousands(sum.games)],
  ];
  return (
    <dl className="mt-7 flex flex-wrap items-end gap-x-8 gap-y-3">
      {items.map(([label, value, tone]) => (
        <div key={label} className="border-l border-line pl-8 first-of-type:border-0 first-of-type:pl-0">
          <dt className="text-xs text-muted">{label}</dt>
          <dd className={clsx('display-num mt-0.5 text-4xl font-extrabold leading-none', tone)}>{value}</dd>
        </div>
      ))}
      {sum.lowSample && <p className="text-xs text-faint">{t('cp.smallSample')}</p>}
    </dl>
  );
}

export function ArenaPanel({ s }: { s: ChampionStats }) {
  const ar = s.arena;
  if (!ar) return null;
  return (
    <section className="panel panel-tick p-5" aria-labelledby="arena-h">
      <h2 id="arena-h" className="panel-title text-2xl">
        {t('arena.title')}
      </h2>
      <p className="text-xs text-muted">{t('arena.sub')}</p>
      <div className="mt-5 space-y-7">
        <div className="grid gap-7 sm:grid-cols-2">
          <Placements ar={ar} />
          <Partners ar={ar} />
        </div>
        <PopularItems ar={ar} />
      </div>
    </section>
  );
}

function PopularItems({ ar }: { ar: Arena }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  if (!ar.items.length) return null;
  return (
    <div>
      <h3 className="font-display text-lg font-bold">{t('arena.items')}</h3>
      <p className="mb-3 text-xs text-muted">{t('arena.itemsNote')}</p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-x-2 gap-y-3">
        {ar.items.map((x) => {
          const it = a.item(x.id);
          return (
            <li key={x.id} className="flex flex-col items-center gap-1 text-center">
              <GameImg src={it.url} alt={it.name || `Item ${x.id}`} size={40} rounded="md" tip={it.name ? <ItemTip id={x.id} /> : undefined} />
              <span className="num text-xs text-muted" title={t('arena.boughtIn', { pct: pct(x.pickRate, 0) })}>
                {pct(x.pickRate, 0)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Placements({ ar }: { ar: Arena }) {
  const total = ar.placements.reduce((s, n) => s + n, 0) || 1;
  const max = Math.max(...ar.placements, 1);
  return (
    <div>
      <h3 className="mb-2.5 font-display text-lg font-bold">{t('arena.placements')}</h3>
      <ol className="flex h-36 items-end gap-1.5" aria-label={t('arena.placements')}>
        {ar.placements.map((n, i) => (
          <li key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${t('arena.place', { n: i + 1 })}: ${pct(n / total, 1)}`}>
            <span className="num text-[11px] text-muted">{pct(n / total, 0)}</span>
            <span
              className={clsx('w-full rounded-t-[3px] transition-[height] duration-500', i === 0 ? 'bg-gold' : i < 4 ? 'bg-win/80' : 'bg-loss/70')}
              style={{ height: `${(n / max) * 100}%`, minHeight: n ? 2 : 0, transitionTimingFunction: 'var(--ease-smooth)' }}
            />
            <span className="num text-xs font-semibold text-muted">{i + 1}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Partners({ ar }: { ar: Arena }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  if (!ar.partners.length) return null;
  return (
    <div>
      <h3 className="mb-2.5 flex items-baseline justify-between gap-2 font-display text-lg font-bold">
        {t('arena.partners')}
        {/* The number on each row is the pair's average finishing place (lower is better); say so instead of leaving a bare decimal. */}
        <span className="font-sans text-xs font-normal text-muted">{t('arena.avgPlaceLower')}</span>
      </h3>
      <ul className="space-y-1.5">
        {ar.partners.slice(0, 6).map((p) => {
          const c = a.champion(p.championId);
          const slug = sd?.champions.get(p.championId)?.id;
          return (
            <li key={p.championId} className="flex items-center gap-2.5 text-sm">
              <GameImg src={c.url} alt="" size={28} rounded="sm" />
              <Link to={slug ? `/champions/${champSlug(slug)}?queue=arena` : '#'} className="min-w-0 flex-1 truncate hover:text-gold">
                {c.name}
              </Link>
              <span className="num text-xs text-muted">{t('common.games', { count: p.games })}</span>
              <span className={clsx('num w-12 text-right font-semibold', placeTone(p.avgPlacement, p.games))} title={t('arena.avgPlace')}>
                {decimal(p.avgPlacement, 2)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
