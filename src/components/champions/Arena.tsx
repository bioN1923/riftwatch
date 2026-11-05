import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import type { Augment, ChampionStats } from '../../../shared/types';
import { api } from '../../lib/api';
import { assets, champSlug, useStaticData } from '../../lib/ddragon';
import { decimal, pct, thousands } from '../../lib/format';
import { GameImg } from '../ui/GameImg';
import { Skeleton } from '../ui/States';
import { SlidingIndicator } from '../ui/Motion';
import { getLang, t } from '../../i18n';

type Arena = NonNullable<ChampionStats['arena']>;
type Rarity = 'all' | 'prismatic' | 'gold' | 'silver';

const RARITY_RING: Record<Augment['rarity'], string> = {
  prismatic: 'ring-2 ring-[#c58cff]',
  gold: 'ring-2 ring-[#e0b44f]',
  silver: 'ring-2 ring-[#a9b6c2]',
  other: 'ring-1 ring-line-strong',
};

export function useAugments() {
  const lang = getLang();
  return useQuery({ queryKey: ['augments', lang], queryFn: ({ signal }) => api.augments(lang, signal), staleTime: 6 * 3600_000, gcTime: Infinity });
}

/** Ordinal place in the site language: 1st, 2. Platz … */
export const placeLabel = (n: number) => t('arena.place', { n });

/** Placement, top-four rate and first-place rate, in the header strip of an Arena champion page. */
export function ArenaStrip({ s }: { s: ChampionStats }) {
  const sum = s.summary;
  const ar = s.arena;
  if (!sum || !ar) return <div className="mt-6" />;
  const items: [string, string, string?][] = [
    [t('arena.avgPlace'), decimal(ar.avgPlacement, 2), ar.avgPlacement <= 4.5 ? 'text-win' : 'text-loss'],
    [t('arena.top4'), pct(sum.winRate, 1), sum.winRate >= 0.5 ? 'text-win' : 'text-loss'],
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
        <Augments ar={ar} />
        <div className="grid gap-7 sm:grid-cols-2">
          <Placements ar={ar} />
          <Partners ar={ar} />
        </div>
      </div>
    </section>
  );
}

function Augments({ ar }: { ar: Arena }) {
  const q = useAugments();
  const [rarity, setRarity] = useState<Rarity>('all');
  const [more, setMore] = useState(false);
  const byId = useMemo(() => new Map((q.data ?? []).map((a) => [a.id, a])), [q.data]);
  const rows = ar.augments.filter((a) => rarity === 'all' || byId.get(a.id)?.rarity === rarity);
  const shown = more ? rows : rows.slice(0, 10);

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-bold">{t('arena.augments')}</h3>
        <div role="tablist" aria-label={t('arena.rarity')} className="relative flex gap-3 text-sm">
          <SlidingIndicator className="h-[2px]" />
          {(['all', 'prismatic', 'gold', 'silver'] as const).map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={rarity === r}
              onClick={() => {
                setRarity(r);
                setMore(false);
              }}
              className={clsx('pb-1 font-medium transition-colors', rarity === r ? 'text-text' : 'text-muted hover:text-text')}
            >
              {t(`arena.rarity.${r}`)}
            </button>
          ))}
        </div>
      </div>
      {q.isPending ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">{t('arena.noAugments')}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <caption className="sr-only">{t('arena.augments')}</caption>
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th scope="col" className="pb-1.5 font-normal">
                    {t('arena.augment')}
                  </th>
                  <th scope="col" className="pb-1.5 text-right font-normal">
                    {t('arena.avgPlaceShort')}
                  </th>
                  <th scope="col" className="pb-1.5 text-right font-normal">
                    {t('arena.top4')}
                  </th>
                  <th scope="col" className="pb-1.5 text-right font-normal">
                    {t('arena.first')}
                  </th>
                  <th scope="col" className="pb-1.5 text-right font-normal">
                    {t('cp.pickRate')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((a) => {
                  const info = byId.get(a.id);
                  return (
                    <tr key={a.id} className="border-t border-line">
                      <th scope="row" className="py-1.5 pr-3 text-left font-normal">
                        <span className="flex items-center gap-2.5">
                          <GameImg
                            src={info?.icon}
                            alt=""
                            size={30}
                            rounded="md"
                            className={clsx('bg-[#0e1b1d]!', RARITY_RING[info?.rarity ?? 'other'])}
                            tip={info ? <AugmentTip a={info} /> : undefined}
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{info?.name ?? `#${a.id}`}</span>
                            {a.games < 10 && <span className="block text-[11px] text-faint">{t('cp.only', { count: a.games })}</span>}
                          </span>
                        </span>
                      </th>
                      <td className={clsx('num py-1.5 text-right font-semibold', a.avgPlacement <= 4.5 ? 'text-win' : 'text-loss')}>{decimal(a.avgPlacement, 2)}</td>
                      <td className="num py-1.5 text-right">{pct(a.winRate, 1)}</td>
                      <td className="num py-1.5 text-right text-muted">{pct(a.firstRate, 1)}</td>
                      <td className="num py-1.5 text-right text-muted">{pct(a.pickRate, 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length > 10 && (
            <button onClick={() => setMore((m) => !m)} className="mt-2 text-sm font-medium text-gold hover:underline">
              {more ? t('arena.less') : t('arena.more', { count: rows.length - 10 })}
            </button>
          )}
          {q.isError && <p className="mt-2 text-xs text-faint">{t('arena.namesUnavailable')}</p>}
        </>
      )}
    </div>
  );
}

function AugmentTip({ a }: { a: Augment }) {
  return (
    <>
      <span className="block font-semibold">{a.name}</span>
      <span className={clsx('block text-xs', a.rarity === 'prismatic' ? 'text-[#c58cff]' : a.rarity === 'gold' ? 'text-gold' : 'text-muted')}>{t(`arena.rarity.${a.rarity === 'other' ? 'all' : a.rarity}`)}</span>
      {a.desc && <span className="mt-1 block whitespace-pre-line text-muted">{a.desc.length > 320 ? `${a.desc.slice(0, 317)}…` : a.desc}</span>}
    </>
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
          <li key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${placeLabel(i + 1)}: ${pct(n / total, 1)}`}>
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
      <h3 className="mb-2.5 font-display text-lg font-bold">{t('arena.partners')}</h3>
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
              <span className={clsx('num w-12 text-right font-semibold', p.avgPlacement <= 4.5 ? 'text-win' : 'text-loss')} title={t('arena.avgPlace')}>
                {decimal(p.avgPlacement, 2)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
