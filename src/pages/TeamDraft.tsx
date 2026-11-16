import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Crosshair, Plus, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import type { TeamPickReason, TeamPicks } from '../../shared/types';
import { api } from '../lib/api';
import { assets, champSlug, useStaticData } from '../lib/ddragon';
import { pct } from '../lib/format';
import { damageMix, damageType } from '../lib/damageMix';
import { keepWhile } from '../lib/keepWhile';
import { readPool } from '../lib/pool';
import { GameImg } from '../components/ui/GameImg';
import { RoleIcon, ROLE_LABEL } from '../components/ui/RoleIcon';
import { ErrorState, Skeleton } from '../components/ui/States';
import { ChampionGrid } from './Draft';
import { t } from '../i18n';

const ROLES = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const;
type Role = (typeof ROLES)[number];
const MAX_ALLIES = 4;
const MAX_ENEMIES = 5;
const SHOWN = 6;

/**
 * Team draft: the picks already locked on both teams in, the best champion for your role out,
 * each with the reasons behind it (lane matchup, other enemies, teammates, damage mix).
 */
export function TeamDraftPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data: sd } = useStaticData();
  const role: Role = (ROLES as readonly string[]).includes(params.get('role') ?? '') ? (params.get('role') as Role) : 'MIDDLE';
  const bySlug = useMemo(() => new Map([...(sd?.champions ?? new Map()).entries()].map(([key, c]) => [champSlug(c.id), key])), [sd]);
  const list = (key: string, max: number) =>
    [...new Set((params.get(key) ?? '').split(',').map((s) => bySlug.get(s.toLowerCase())).filter((x): x is number => x != null))].slice(0, max);
  const allies = list('allies', MAX_ALLIES);
  const enemies = list('enemies', MAX_ENEMIES);
  const pool = readPool(role)
    .split(',')
    .map((s) => bySlug.get(s.toLowerCase()))
    .filter((x): x is number => x != null);

  useEffect(() => {
    document.title = `${t('td.heading')} · Riftwatch`;
  }, []);

  const set = (key: 'role' | 'allies' | 'enemies', value: string | number[]) => {
    const p = new URLSearchParams(params);
    if (typeof value === 'string') p.set(key, value);
    else {
      const slugs = value.map((id) => champSlug(sd!.champions.get(id)!.id)).join(',');
      if (slugs) p.set(key, slugs);
      else p.delete(key);
    }
    // Commas stay readable in a shared link (?allies=leesin,jinx rather than leesin%2Cjinx).
    navigate({ search: `?${p.toString().replace(/%2C/gi, ',')}` }, { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{t('td.heading')}</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">{t('td.lead')}</p>
      <p className="mt-1 text-sm">
        <Link to="/draft" className="text-gold hover:underline">
          {t('td.toLane')}
        </Link>
      </p>

      <div role="tablist" aria-label={t('draft.role')} className="mt-6 flex flex-wrap gap-1.5">
        {ROLES.map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={role === r}
            onClick={() => set('role', r)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm font-medium transition-colors',
              role === r ? 'border-gold bg-gold/10 text-text' : 'border-line text-muted hover:text-text',
            )}
          >
            <RoleIcon role={r} size={15} /> {ROLE_LABEL[r]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TeamPanel
          id="td-allies"
          title={t('td.allies')}
          lead={t('td.alliesLead', { n: MAX_ALLIES })}
          icon={<Users className="size-4 text-win" aria-hidden />}
          tone="win"
          picks={allies}
          max={MAX_ALLIES}
          exclude={[...allies, ...enemies]}
          onChange={(next) => set('allies', next)}
        />
        <TeamPanel
          id="td-enemies"
          title={t('td.enemies')}
          lead={t('td.enemiesLead', { n: MAX_ENEMIES })}
          icon={<Crosshair className="size-4 text-loss" aria-hidden />}
          tone="loss"
          picks={enemies}
          max={MAX_ENEMIES}
          exclude={[...allies, ...enemies]}
          onChange={(next) => set('enemies', next)}
        />
      </div>

      <Suggestions role={role} allies={allies} enemies={enemies} pool={pool} mark={bySlug.get((params.get('mark') ?? '').toLowerCase())} />
    </div>
  );
}

function TeamPanel(props: {
  id: string;
  title: string;
  lead: string;
  icon: React.ReactNode;
  tone: 'win' | 'loss';
  picks: number[];
  max: number;
  exclude: number[];
  onChange: (next: number[]) => void;
}) {
  const { id, title, lead, icon, tone, picks, max, exclude, onChange } = props;
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const [adding, setAdding] = useState(false);
  return (
    <section className="panel p-4" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="panel-title flex items-center gap-1.5">
        {icon} {title}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{lead}</p>
      <ul className="mt-3 flex min-h-12 flex-wrap gap-2">
        {picks.map((c) => (
          <li key={c} className="flex items-center gap-2 rounded border border-line bg-surface py-1 pl-1 pr-1.5">
            <GameImg src={a.champion(c).url} alt="" size={36} rounded="sm" className={clsx('ring-1', tone === 'win' ? 'ring-win/60' : 'ring-loss/60')} />
            <span className="text-sm">{a.champion(c).name}</span>
            <button
              onClick={() => onChange(picks.filter((x) => x !== c))}
              aria-label={t('td.remove', { champion: a.champion(c).name })}
              className="ml-1 grid size-6 place-items-center rounded text-muted hover:bg-raised hover:text-text"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </li>
        ))}
        {picks.length < max && !adding && (
          <li>
            <button
              onClick={() => setAdding(true)}
              className="inline-flex h-11 items-center gap-1.5 rounded border border-dashed border-line-strong px-3 text-sm text-muted hover:border-gold/60 hover:text-text"
            >
              <Plus className="size-4" aria-hidden /> {t('td.add')}
            </button>
          </li>
        )}
      </ul>
      {adding && picks.length < max && (
        <div className="mt-2 flex justify-end">
          <button onClick={() => setAdding(false)} className="inline-flex min-h-[24px] items-center gap-1 rounded border border-line px-2.5 py-1 text-xs font-medium text-muted hover:text-text">
            {t('td.done')}
          </button>
        </div>
      )}
      {adding && picks.length < max && (
        <ChampionGrid
          exclude={exclude}
          onPick={(c) => {
            const next = [...picks, c].slice(0, max);
            onChange(next);
            if (next.length >= max) setAdding(false);
          }}
        />
      )}
    </section>
  );
}

/* ----------------------------------------------------------- suggestions */

type Pick = TeamPicks['picks'][number];

function Suggestions({ role, allies, enemies, pool, mark }: { role: Role; allies: number[]; enemies: number[]; pool: number[]; mark?: number }) {
  const { data: sd } = useStaticData();
  const q = useQuery({
    queryKey: ['team-draft', role, allies.join(','), enemies.join(',')],
    queryFn: ({ signal }) => api.teamPicks(role, allies, enemies, signal),
    staleTime: 5 * 60_000,
    placeholderData: keepWhile(['team-draft']),
  });
  if (q.isPending) return <Skeleton className="mt-6 h-96" />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const picks = q.data.picks;
  if (!picks.length) return <p className="panel mt-6 p-4 text-sm text-muted">{t('td.noPicks', { role: ROLE_LABEL[role] })}</p>;
  const nothingIn = !allies.length && !enemies.length;
  const best = picks.slice(0, SHOWN);
  const poolSet = new Set(pool);
  const fromPool = picks.filter((p) => poolSet.has(p.championId)).slice(0, 5);
  // Opened from a live game: the pick that was actually made, wherever it ranks.
  const marked = mark != null ? picks.find((p) => p.championId === mark) : undefined;
  const markName = mark != null ? assets(sd).champion(mark).name : '';
  return (
    <div className={clsx('mt-6 space-y-6 transition-opacity duration-200', q.isPlaceholderData && 'pointer-events-none opacity-60')} aria-busy={q.isPlaceholderData}>
      {mark != null && (
        <section aria-labelledby="td-mark-h">
          <h2 id="td-mark-h" className="panel-title">
            {t('td.mark')}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {marked ? t('td.markLead', { champion: markName, rank: picks.indexOf(marked) + 1, count: picks.length }) : t('td.markMissing', { champion: markName, role: ROLE_LABEL[role] })}
          </p>
          {marked && (
            <ol className="mt-3 grid gap-3 md:grid-cols-2">
              <PickCard p={marked} rank={picks.indexOf(marked) + 1} allies={allies} inPool={poolSet.has(marked.championId)} />
            </ol>
          )}
        </section>
      )}

      <section aria-labelledby="td-best-h">
        <h2 id="td-best-h" className="panel-title flex items-center gap-1.5">
          <Sparkles className="size-4 text-gold" aria-hidden /> {t('td.best', { role: ROLE_LABEL[role] })}
        </h2>
        <p className="mt-0.5 max-w-3xl text-xs text-muted">{nothingIn ? t('td.emptyLead') : t('td.bestLead', { patch: q.data.patch ?? '' })}</p>
        {!nothingIn && (
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>
              <span className="font-semibold text-win">+2.0</span> / <span className="font-semibold text-loss">−2.0</span> {t('td.keySure')}
            </span>
            <span>
              <span className="font-semibold">+2.0</span> {t('td.keyChance')}
            </span>
          </p>
        )}
        <ol className="mt-3 grid gap-3 md:grid-cols-2">
          {best.map((p, i) => (
            <PickCard key={p.championId} p={p} rank={i + 1} allies={allies} inPool={poolSet.has(p.championId)} />
          ))}
        </ol>
      </section>

      {fromPool.length > 0 && !nothingIn && (
        <section aria-labelledby="td-pool-h">
          <h2 id="td-pool-h" className="panel-title flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-gold" aria-hidden /> {t('td.pool')}
          </h2>
          <p className="mt-0.5 text-xs text-muted">{t('td.poolLead', { role: ROLE_LABEL[role] })}</p>
          <ol className="mt-3 grid gap-3 md:grid-cols-2">
            {fromPool.map((p) => (
              <PickCard key={p.championId} p={p} rank={picks.indexOf(p) + 1} allies={allies} inPool />
            ))}
          </ol>
        </section>
      )}

      <p className="text-xs text-faint">{t('td.note')}</p>
    </div>
  );
}

const signed = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(1)}`;

function PickCard({ p, rank, allies, inPool }: { p: Pick; rank: number; allies: number[]; inPool: boolean }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const c = a.champion(p.championId);
  const slug = sd?.champions.get(p.championId)?.id;
  const reasons = [...p.reasons].filter((r) => Math.abs(r.delta) >= 0.005).sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  // Damage mix: a nudge in words only (no win-rate data behind it, so it doesn't move the score).
  const mix = allies.length >= 2 ? damageMix(allies.map((id) => sd?.champions.get(id)?.dmg)) : null;
  const mine = damageType(sd?.champions.get(p.championId)?.dmg);
  const dmgNote = mix?.lean === 'ad' && mine === 'ap' ? t('td.dmgAp') : mix?.lean === 'ap' && mine === 'ad' ? t('td.dmgAd') : null;
  return (
    <li className="panel p-4">
      <div className="flex items-center gap-3">
        <span className="num w-5 text-center font-display text-lg font-bold text-faint">{rank}</span>
        <GameImg src={c.url} alt="" size={44} rounded="md" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-display text-xl font-bold">
            {slug ? (
              <Link to={`/champions/${champSlug(slug)}`} className="hover:text-gold">
                {c.name}
              </Link>
            ) : (
              c.name
            )}
            {inPool && <span className="rounded-sm bg-gold/15 px-1 font-sans text-[10px] font-semibold text-gold">{t('draft.inPool')}</span>}
          </p>
          <p className="num text-xs text-muted">{t('td.usual', { rate: pct(p.winRate, 1), games: t('common.games', { count: p.games }) })}</p>
        </div>
        <div className="text-right" title={t('td.scoreHelp')}>
          <p className="num font-display text-2xl font-bold">{signed(p.score)}</p>
          <p className="text-[11px] text-muted">{t('td.score')}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        <li className="flex items-start gap-2 text-muted">
          <span className="num w-12 shrink-0 text-right text-xs font-semibold">{signed(p.strength)}</span>
          <span>{t('td.own')}</span>
        </li>
        {reasons.slice(0, 5).map((r) => (
          <ReasonRow key={`${r.kind}-${r.championId}`} r={r} />
        ))}
        {dmgNote && (
          <li className="flex items-start gap-2">
            <span className="w-12 shrink-0 text-right text-xs text-faint">–</span>
            <span className="text-kda-great">{dmgNote}</span>
          </li>
        )}
        {!reasons.length && (allies.length > 0 || p.reasons.length === 0) && (
          <li className="flex items-start gap-2 text-xs text-faint">
            <span className="w-12 shrink-0" />
            <span>{t('td.noPairs')}</span>
          </li>
        )}
      </ul>
    </li>
  );
}

function ReasonRow({ r }: { r: TeamPickReason }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const good = r.delta > 0;
  const vars = { champion: a.champion(r.championId).name, rate: pct(r.winRate), games: t('common.games', { count: r.games }) };
  const text =
    r.kind === 'lane'
      ? t(good ? 'td.r.laneGood' : 'td.r.laneBad', vars)
      : r.kind === 'enemy'
        ? t(good ? 'td.r.enemyGood' : 'td.r.enemyBad', vars)
        : t(good ? 'td.r.withGood' : 'td.r.withBad', vars);
  return (
    <li className="flex items-start gap-2">
      <span className={clsx('num w-12 shrink-0 text-right text-xs font-semibold', r.sure ? (good ? 'text-win' : 'text-loss') : 'text-muted')}>{signed(r.delta)}</span>
      <span className="flex min-w-0 items-start gap-1.5">
        <GameImg src={a.champion(r.championId).url} alt="" size={18} rounded="sm" className="mt-0.5 shrink-0" />
        <span className={clsx(!r.sure && 'text-muted')} title={r.sure ? undefined : t('td.chance')}>
          {text}
        </span>
      </span>
    </li>
  );
}
