import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowLeftRight, BarChart3, ChevronDown, Scale, Star, Clock, Trophy, Users } from 'lucide-react';
import type { MatchSummary, Profile } from '../../shared/types';
import { PLATFORMS, getPlatform } from '../../shared/regions';
import { api, ApiClientError } from '../lib/api';
import { assets, champSlug, rankEmblem, useStaticData } from '../lib/ddragon';
import { compact, decimal, formatKda, kdaRatio, kdaTone, multikill, pct, regionName, sureTone, thousands, tierName, wlTone } from '../lib/format';
import { fromSlug, parseRiotId, profilePath, querySlug, type RiotId } from '../lib/riotId';
import { useFavorites, useRecent, useRegion, type SavedPlayer } from '../lib/storage';
import { me, result } from '../lib/stats';
import { personalRecords, type PersonalRecord } from '../lib/records';
import { clearEdge, ROLE_NEUTRAL, roleGap, roleRecord, summarize, together, type PlayerSummary } from '../lib/compare';
import { GameImg } from '../components/ui/GameImg';
import { ROLE_LABEL, RoleIcon } from '../components/ui/RoleIcon';
import { ErrorState, Skeleton } from '../components/ui/States';
import { fadeIn } from '../lib/motion';
import { t } from '../i18n';
import { LadderPlace } from '../components/ui/LadderPlace';

const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER']);
type Queue = 'solo' | 'all';
interface Pick {
  platform: string;
  id: RiotId;
}

/** "euw1/Name-TAG" in the URL, so a comparison link can be shared. */
const encodePick = (p: Pick) => `${p.platform}/${querySlug(p.id)}`;
function decodePick(raw: string | null): Pick | null {
  if (!raw) return null;
  const i = raw.indexOf('/');
  if (i < 0) return null;
  const platform = getPlatform(raw.slice(0, i))?.id;
  const id = fromSlug(raw.slice(i + 1));
  return platform && id ? { platform, id } : null;
}
const label = (p: Pick | null) => (p ? `${p.id.gameName}#${p.id.tagLine}` : '');

export function ComparePage() {
  const [params, setParams] = useSearchParams();
  const a = decodePick(params.get('a'));
  const b = decodePick(params.get('b'));
  const queue: Queue = params.get('queue') === 'all' ? 'all' : 'solo';

  useEffect(() => {
    document.title = a && b ? t('cmp.titleVs', { a: a.id.gameName, b: b.id.gameName }) : t('cmp.title');
  }, [a?.id.gameName, b?.id.gameName]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (next: { a?: Pick | null; b?: Pick | null; queue?: Queue }) => {
    const p = new URLSearchParams(params);
    for (const k of ['a', 'b'] as const) {
      if (!(k in next)) continue;
      const v = next[k];
      if (v) p.set(k, encodePick(v));
      else p.delete(k);
    }
    if (next.queue) {
      if (next.queue === 'solo') p.delete('queue');
      else p.set('queue', next.queue);
    }
    setParams(p, { replace: 'queue' in next && !('a' in next) });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{t('cmp.heading')}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t('cmp.lead')}</p>

      <PickerForm key={`${label(a)}|${label(b)}`} a={a} b={b} onSubmit={(na, nb) => set({ a: na, b: nb })} />

      {a && b ? (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div role="radiogroup" aria-label={t('cmp.queue')} className="flex gap-1 rounded border border-line bg-surface p-1 text-sm">
              {(['solo', 'all'] as const).map((q) => (
                <button
                  key={q}
                  role="radio"
                  aria-checked={queue === q}
                  onClick={() => set({ queue: q })}
                  className={clsx('rounded-sm px-3 py-1 font-medium transition-colors', queue === q ? 'bg-raised text-text' : 'text-muted hover:text-text')}
                >
                  {t(`queueFilter.${q}`)}
                </button>
              ))}
            </div>
            <button onClick={() => set({ a: b, b: a })} className="inline-flex h-8 items-center gap-1.5 rounded border border-line-strong px-3 text-sm font-medium text-muted transition-colors hover:border-gold/60 hover:text-text">
              <ArrowLeftRight className="size-3.5" aria-hidden /> {t('cmp.swap')}
            </button>
          </div>
          <Comparison a={a} b={b} queue={queue} />
        </>
      ) : (
        <WhatYouSee />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ picker */

function PickerForm({ a, b, onSubmit }: { a: Pick | null; b: Pick | null; onSubmit: (a: Pick | null, b: Pick | null) => void }) {
  const [region] = useRegion();
  const [text, setText] = useState([label(a), label(b)]);
  const [regions, setRegions] = useState([a?.platform ?? region, b?.platform ?? region]);
  const favorites = useFavorites();
  const recent = useRecent();
  const quick = useMemo(() => {
    const seen = new Set<string>();
    return [...favorites.map((p) => ({ p, fav: true })), ...recent.map((p) => ({ p, fav: false }))].filter(({ p }) => {
      const k = `${p.platform}${p.gameName}#${p.tagLine}`.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 8);
  }, [favorites, recent]);

  const parse = (i: number): Pick | null => {
    const id = parseRiotId(text[i], getPlatform(regions[i])?.defaultTag ?? 'EUW');
    return id ? { platform: regions[i], id } : null;
  };
  const picks = [parse(0), parse(1)];

  const fill = (p: SavedPlayer) => {
    const slot = text[0].trim() ? 1 : 0;
    setText((x) => x.map((v, i) => (i === slot ? `${p.gameName}#${p.tagLine}` : v)));
    setRegions((x) => x.map((v, i) => (i === slot ? p.platform : v)));
  };

  return (
    <form
      className="mt-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (picks[0] && picks[1]) onSubmit(picks[0], picks[1]);
      }}
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] md:items-end">
        {[0, 1].map((i) => (
          <div key={i} className={clsx('flex gap-2', i === 1 && 'md:order-3')}>
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-xs text-muted">{i === 0 ? t('cmp.player1') : t('cmp.player2')}</span>
              <input
                value={text[i]}
                onChange={(e) => setText((x) => x.map((v, j) => (j === i ? e.target.value : v)))}
                placeholder={t('cmp.placeholder')}
                spellCheck={false}
                autoComplete="off"
                className="h-10 w-full rounded border border-line bg-surface px-3 text-sm outline-none placeholder:text-faint focus:border-gold focus:ring-2 focus:ring-gold/50"
              />
            </label>
            <label className="relative w-24 shrink-0">
              <span className="mb-1 block text-xs text-muted">{t('ms.region')}</span>
              <select
                value={regions[i]}
                onChange={(e) => setRegions((x) => x.map((v, j) => (j === i ? e.target.value : v)))}
                className="h-10 w-full appearance-none rounded border border-line bg-surface px-3 font-display text-lg font-bold"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute bottom-3 right-2.5 size-4 text-muted" aria-hidden />
            </label>
          </div>
        ))}
        <span className="hidden h-10 items-center px-1 font-display text-xl font-bold text-faint md:order-2 md:flex" aria-hidden>
          {t('pc.vs')}
        </span>
        <button
          type="submit"
          disabled={!picks[0] || !picks[1]}
          className="flex h-10 items-center justify-center gap-2 rounded bg-gold px-5 font-semibold text-gold-ink transition hover:brightness-110 disabled:opacity-40 md:order-4"
        >
          <Scale className="size-4" aria-hidden /> {t('cmp.go')}
        </button>
      </div>
      {quick.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted">{t('cmp.quick')}</span>
          {quick.map(({ p, fav }) => (
            <button
              key={`${p.platform}${p.gameName}${p.tagLine}`}
              type="button"
              onClick={() => fill(p)}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:border-gold/60 hover:text-text"
            >
              {fav ? <Star className="size-3 fill-gold text-gold" aria-hidden /> : <Clock className="size-3" aria-hidden />}
              {p.gameName}
              <span className="text-faint">#{p.tagLine}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

/** Before two players are picked: what a comparison shows, so the page isn't a lone form. */
function WhatYouSee() {
  const parts = [
    { icon: Trophy, title: t('cmp.see.rank'), body: t('cmp.see.rankBody') },
    { icon: BarChart3, title: t('cmp.see.stats'), body: t('cmp.see.statsBody') },
    { icon: Users, title: t('cmp.see.roles'), body: t('cmp.see.rolesBody') },
    { icon: Star, title: t('cmp.see.best'), body: t('cmp.see.bestBody') },
  ];
  return (
    <section className="mt-10" aria-labelledby="cmp-see-h">
      <h2 id="cmp-see-h" className="panel-title">
        {t('cmp.see.title')}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{t('cmp.pickTwo')}</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {parts.map(({ icon: Icon, title, body }) => (
          <li key={title} className="panel p-4">
            <p className="flex items-center gap-2 font-display text-lg font-bold">
              <Icon className="size-4 text-gold" aria-hidden />
              {title}
            </p>
            <p className="mt-1.5 text-sm text-muted">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------- comparison */

function usePlayer(pick: Pick, queue: Queue) {
  const profileQ = useQuery({
    queryKey: ['profile', pick.platform, pick.id.gameName.toLowerCase(), pick.id.tagLine.toLowerCase()],
    queryFn: ({ signal }) => api.profile(pick.platform, pick.id.gameName, pick.id.tagLine, { signal }),
  });
  const puuid = profileQ.data?.account.puuid;
  const matchesQ = useQuery({
    queryKey: ['compare-matches', pick.platform, puuid, queue],
    enabled: !!puuid,
    queryFn: ({ signal }) => api.matches(pick.platform, puuid!, { start: 0, count: 20, queue }, signal),
    staleTime: 5 * 60_000,
  });
  return { profileQ, matchesQ };
}

function Comparison({ a, b, queue }: { a: Pick; b: Pick; queue: Queue }) {
  const A = usePlayer(a, queue);
  const B = usePlayer(b, queue);
  const pa = A.profileQ.data;
  const pb = B.profileQ.data;
  const ma = A.matchesQ.data?.matches;
  const mb = B.matchesQ.data?.matches;
  const sa = useMemo(() => (pa && ma ? summarize(ma, pa.account.puuid) : undefined), [pa, ma]);
  const sb = useMemo(() => (pb && mb ? summarize(mb, pb.account.puuid) : undefined), [pb, mb]);

  const failed = [A, B].map((x, i) => (x.profileQ.isError ? { error: x.profileQ.error, pick: i === 0 ? a : b } : null)).filter(Boolean);
  if (failed.length) {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {failed.map((f) => {
          const nf = f!.error instanceof ApiClientError && f!.error.code === 'NOT_FOUND';
          return nf ? (
            <div key={label(f!.pick)} className="panel p-4 text-sm">
              <p className="font-semibold">{label(f!.pick)}</p>
              <p className="mt-1 text-loss">{t('ms.notFound')}</p>
            </div>
          ) : (
            <ErrorState key={label(f!.pick)} error={f!.error} />
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {pa ? <Header p={pa} side="a" /> : <Skeleton className="h-36" />}
        {pb ? <Header p={pb} side="b" /> : <Skeleton className="h-36" />}
      </div>

      {sa && sb && pa && pb && ma && mb ? (
        sa.games === 0 || sb.games === 0 ? (
          <p className="panel p-4 text-sm text-muted">{t('cmp.noGames', { name: sa.games === 0 ? pa.account.gameName : pb.account.gameName })}</p>
        ) : (
          <>
            <Form a={ma} b={mb} pa={pa} pb={pb} />
            <Together a={ma} b={mb} pa={pa} pb={pb} />
            <Metrics a={sa} b={sb} nameA={pa.account.gameName} nameB={pb.account.gameName} />
            <div className="grid gap-4 md:grid-cols-2">
              <Roles a={sa} b={sb} ma={ma} mb={mb} pa={pa} pb={pb} />
              <Champions a={sa} b={sb} nameA={pa.account.gameName} nameB={pb.account.gameName} />
            </div>
            <BestGames a={ma} b={mb} pa={pa} pb={pb} />
          </>
        )
      ) : (
        <Skeleton className="h-96" />
      )}
    </div>
  );
}

function Header({ p, side }: { p: Profile; side: 'a' | 'b' }) {
  const { data: sd } = useStaticData();
  const as = assets(sd);
  const solo = p.ranked.find((r) => r.queueType === 'RANKED_SOLO_5x5');
  const games = solo ? solo.wins + solo.losses : 0;
  const wr = games ? solo!.wins / games : 0;
  return (
    <article className={clsx('panel relative overflow-hidden p-3 sm:p-4', side === 'a' ? 'border-t-2 border-t-[var(--series-1)]' : 'border-t-2 border-t-[var(--series-2)]')}>
      <Link to={profilePath(p.platform, p.account)} className="group flex items-center gap-3">
        <GameImg src={as.profileIcon(p.summoner.profileIconId)} alt="" size={44} rounded="md" />
        <span className="min-w-0">
          <span className="block truncate font-display text-xl font-bold leading-tight group-hover:text-gold sm:text-2xl">{p.account.gameName}</span>
          {/* Phones: tag and region on two lines; one line ("#EUW · Europe West") had no room and got cut. */}
          <span className="block text-xs leading-snug text-muted">
            #{p.account.tagLine}
            <span className="max-sm:block">
              <span className="max-sm:hidden"> · </span>
              {regionName(p.platform)}
            </span>
          </span>
        </span>
      </Link>
      <div className="mt-3 flex items-center gap-2.5">
        {solo ? (
          <>
            <img src={rankEmblem(solo.tier)} alt="" {...fadeIn()} className="size-10 sm:size-12" />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold leading-tight">
                {tierName(solo.tier)} {APEX.has(solo.tier) ? '' : solo.rank}
              </p>
              <p className="num text-xs text-muted">
                {t('common.lp', { lp: solo.leaguePoints })} · <span className={clsx('font-semibold', sureTone(wr, games))}>{pct(wr)}</span> · <span className="whitespace-nowrap">{t('common.games', { count: games })}</span>
              </p>
              <LadderPlace entry={solo} ladder={{ platform: p.platform, puuid: p.account.puuid, queue: 'solo' }} />
            </div>
          </>
        ) : (
          <p className="font-display text-lg font-bold text-faint">{t('common.unranked')}</p>
        )}
      </div>
    </article>
  );
}

function Form({ a, b, pa, pb }: { a: MatchSummary[]; b: MatchSummary[]; pa: Profile; pb: Profile }) {
  const strip = (ms: MatchSummary[], p: Profile) => (
    <ol className="flex gap-[3px]" aria-label={t('cmp.formAria', { name: p.account.gameName })}>
      {ms.map((m) => {
        const mp = me(m, p.account.puuid);
        const r = mp ? result(m, mp) : 'remake';
        return <li key={m.id} title={t(`result.${r}`)} className={clsx('h-3.5 flex-1 rounded-[2px]', r === 'win' ? 'bg-win' : r === 'loss' ? 'bg-loss' : 'bg-faint')} />;
      })}
    </ol>
  );
  return (
    <section className="panel p-4" aria-labelledby="cmp-form-h">
      <h2 id="cmp-form-h" className="panel-title">
        {t('cmp.form', { count: Math.max(a.length, b.length) })}
      </h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {[
          [a, pa],
          [b, pb],
        ].map(([ms, p], i) => (
          <div key={i}>
            <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
              <span className="size-2 rounded-full" style={{ background: i === 0 ? 'var(--series-1)' : 'var(--series-2)' }} aria-hidden />
              {(p as Profile).account.gameName}
            </p>
            {strip(ms as MatchSummary[], p as Profile)}
          </div>
        ))}
      </div>
    </section>
  );
}

function Together({ a, b, pa, pb }: { a: MatchSummary[]; b: MatchSummary[]; pa: Profile; pb: Profile }) {
  const tg = together(a, b, pa.account.puuid, pb.account.puuid);
  if (!tg.sameGames && !tg.vsGames) return null;
  return (
    <section className="panel flex flex-wrap gap-x-8 gap-y-2 p-4 text-sm" aria-label={t('cmp.together')}>
      <h2 className="panel-title w-full">{t('cmp.together')}</h2>
      {tg.sameGames > 0 && (
        <p>
          {t.rich('cmp.sameTeam', {
            games: <span className="num font-semibold">{tg.sameGames}</span>,
            record: (
              <span className="num">
                <span className="text-win">{t('common.wins', { count: tg.sameWins })}</span> <span className="text-loss">{t('common.losses', { count: tg.sameGames - tg.sameWins })}</span>
              </span>
            ),
          })}
        </p>
      )}
      {tg.vsGames > 0 && (
        <p>
          {t.rich('cmp.against', {
            games: <span className="num font-semibold">{tg.vsGames}</span>,
            a: <span className="font-semibold">{pa.account.gameName}</span>,
            wins: <span className="num font-semibold">{tg.vsWinsA}</span>,
          })}
        </p>
      )}
    </section>
  );
}

interface MetricDef {
  key: string;
  label: string;
  get: (s: PlayerSummary) => number;
  fmt: (v: number) => string;
  lowerBetter?: boolean;
}

function Metrics({ a, b, nameA, nameB }: { a: PlayerSummary; b: PlayerSummary; nameA: string; nameB: string }) {
  const one = (v: number) => decimal(v, 1);
  const rows: MetricDef[] = [
    { key: 'wr', label: t('pc.row.wr'), get: (s) => s.winRate, fmt: (v) => pct(v) },
    { key: 'kda', label: t('common.kda'), get: (s) => s.kda, fmt: formatKda },
    { key: 'k', label: t('pc.row.kills'), get: (s) => s.kills, fmt: one },
    { key: 'd', label: t('pc.row.deaths'), get: (s) => s.deaths, fmt: one, lowerBetter: true },
    { key: 'a', label: t('pc.row.assists'), get: (s) => s.assists, fmt: one },
    { key: 'kp', label: t('stats.col.kp'), get: (s) => s.kp, fmt: (v) => pct(v) },
    { key: 'cs', label: t('pc.row.cs'), get: (s) => s.csMin, fmt: one },
    { key: 'dmg', label: t('pc.row.dmg'), get: (s) => s.dmgMin, fmt: thousands },
    { key: 'gold', label: t('pc.row.gold'), get: (s) => s.goldMin, fmt: thousands },
    { key: 'vision', label: t('stats.col.vision'), get: (s) => s.visionMin, fmt: (v) => decimal(v, 2) },
    { key: 'solo', label: t('cmp.soloKills'), get: (s) => s.soloKills, fmt: one },
    { key: 'score', label: t('cmp.score'), get: (s) => s.score, fmt: one },
  ];
  let winsA = 0;
  let winsB = 0;
  let close = 0;
  // A jungler's CS or a support's damage isn't a fair fight: with different main roles, or when one
  // player is spread over several roles, only role-neutral rows get a winner.
  const roles = roleGap(a, b);
  const lines = rows.map((r) => {
    const va = r.get(a);
    const vb = r.get(b);
    const fa = finite(va);
    const fb = finite(vb);
    const fair = !roles || ROLE_NEUTRAL.has(r.key);
    // Gold only for a gap bigger than game-to-game noise: 50% vs 58% over 18 games is no edge.
    const better = !fair || r.fmt(va) === r.fmt(vb) ? 0 : clearEdge(fa, fb, a.se[r.key] ?? Infinity, b.se[r.key] ?? Infinity, r.lowerBetter);
    if (fair && better === 0 && r.fmt(va) !== r.fmt(vb)) close++;
    if (better < 0) winsA++;
    if (better > 0) winsB++;
    return { r, va, vb, fa, fb, better };
  });

  return (
    <section className="panel p-4" aria-labelledby="cmp-m-h">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="cmp-m-h" className="panel-title">
          {t('cmp.perGame')}
        </h2>
        <p className="text-xs text-muted">
          {t('cmp.basedOn', { a: a.games, b: b.games })} ·{' '}
          {t.rich('cmp.edges', {
            a: <span className="font-semibold text-text">{nameA}</span>,
            na: <span className="num font-semibold text-text">{winsA}</span>,
            b: <span className="font-semibold text-text">{nameB}</span>,
            nb: <span className="num font-semibold text-text">{winsB}</span>,
          })}
        </p>
      </div>
      {close > 0 && <p className="mt-1 text-xs text-faint">{t('cmp.clearNote', { count: close })}</p>}
      {roles && (
        <p className="mt-2 rounded border border-line bg-raised px-3 py-2 text-xs text-muted">
          {roles.kind === 'different'
            ? t('cmp.rolesDiffer', { a: nameA, ra: ROLE_LABEL[roles.ra], b: nameB, rb: ROLE_LABEL[roles.rb] })
            : t('cmp.rolesFlex', { name: roles.who === 'a' ? nameA : nameB, role: ROLE_LABEL[roles.role], share: pct(roles.share) })}
        </p>
      )}
      <table className="mt-3 w-full text-sm">
        <caption className="sr-only">{t('cmp.perGame')}</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{nameA}</th>
            <th scope="col">{t('pc.stat')}</th>
            <th scope="col">{nameB}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(({ r, va, vb, fa, fb, better }) => {
            const total = fa + fb || 1;
            const shareA = r.lowerBetter ? fb / total : fa / total;
            return (
              <tr key={r.key} className="border-t border-line first:border-t-0">
                <td className={clsx('num w-[30%] py-2 pr-2 text-right tabular-nums', better < 0 ? 'font-bold text-gold' : 'text-muted', r.key === 'kda' && better >= 0 && kdaTone(va))}>{r.fmt(va)}</td>
                <th scope="row" className="py-2 font-normal">
                  <span className="block text-center text-xs text-muted">{r.label}</span>
                  <span className="mt-1 flex h-1 overflow-hidden rounded-full bg-sunken" aria-hidden>
                    <span className="h-full transition-[width] duration-500" style={{ width: `${shareA * 100}%`, background: 'var(--series-1)', transitionTimingFunction: 'var(--ease-smooth)' }} />
                    <span className="h-full flex-1" style={{ background: 'var(--series-2)' }} />
                  </span>
                </th>
                <td className={clsx('num w-[30%] py-2 pl-2 tabular-nums', better > 0 ? 'font-bold text-gold' : 'text-muted', r.key === 'kda' && better <= 0 && kdaTone(vb))}>{r.fmt(vb)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

/** A perfect KDA is Infinity; treat it as a large number when comparing and drawing bars. */
const finite = (v: number) => (Number.isFinite(v) ? v : 99);

function Roles({ a, b, ma, mb, pa, pb }: { a: PlayerSummary; b: PlayerSummary; ma: MatchSummary[]; mb: MatchSummary[]; pa: Profile; pb: Profile }) {
  const nameA = pa.account.gameName;
  const nameB = pb.account.gameName;
  const recA = useMemo(() => roleRecord(ma, pa.account.puuid), [ma, pa]);
  const recB = useMemo(() => roleRecord(mb, pb.account.puuid), [mb, pb]);
  const share = (s: PlayerSummary, r: string) => (s.games ? (s.ov.roles[r] ?? 0) / s.games : 0);
  // Only roles at least one of them played; most-played (combined share) first.
  const roles = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']
    .filter((r) => share(a, r) > 0 || share(b, r) > 0)
    .sort((x, y) => share(a, y) + share(b, y) - (share(a, x) + share(b, x)));
  return (
    <section className="panel p-4" aria-labelledby="cmp-r-h">
      <h2 id="cmp-r-h" className="panel-title">
        {t('stats.byRole')}
      </h2>
      <Legend nameA={nameA} nameB={nameB} />
      <ul className="mt-3 space-y-3">
        {roles.map((r) => (
          <li key={r}>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
              <span aria-hidden>
                <RoleIcon role={r} size={14} className="text-muted" />
              </span>
              {ROLE_LABEL[r as keyof typeof ROLE_LABEL]}
            </p>
            <div className="space-y-1">
              {([
                [share(a, r), recA[r]],
                [share(b, r), recB[r]],
              ] as const).map(([v, rec], i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_2.25rem_6.5rem] items-center gap-2">
                  <span className="h-1.5 overflow-hidden rounded-full bg-sunken">
                    <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${v * 100}%`, background: i === 0 ? 'var(--series-1)' : 'var(--series-2)' }} />
                  </span>
                  <span className="num text-right text-xs text-muted">{pct(v, 0)}</span>
                  <span className="num truncate text-right text-xs text-faint">
                    {rec && rec.games > 0 ? (
                      <>
                        {t('common.games', { count: rec.games })} · <span className={sureTone(rec.wins / rec.games, rec.games)}>{pct(rec.wins / rec.games, 0)}</span>
                      </>
                    ) : (
                      '–'
                    )}
                  </span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-faint">{t('cmp.roleNote')}</p>
    </section>
  );
}

/** Each player's personal records side by side (the best single game for each, among the loaded ones). */
function BestGames({ a, b, pa, pb }: { a: MatchSummary[]; b: MatchSummary[]; pa: Profile; pb: Profile }) {
  const { data: sd } = useStaticData();
  const as = useMemo(() => personalRecords(a, pa.account.puuid), [a, pa.account.puuid]);
  const bs = useMemo(() => personalRecords(b, pb.account.puuid), [b, pb.account.puuid]);
  const ids = (['kills', 'kda', 'damage', 'multi', 'cspm', 'vision'] as const).filter((id) => as.some((r) => r.id === id) || bs.some((r) => r.id === id));
  if (ids.length < 3) return null;
  const show = (r: PersonalRecord | undefined) => {
    if (!r) return '–';
    if (r.id === 'kda') return r.p.deaths === 0 ? t('rec.perfect') : formatKda(r.value);
    if (r.id === 'damage') return compact(r.value);
    if (r.id === 'cspm' || r.id === 'vision') return decimal(r.value, 1);
    if (r.id === 'multi') return multikill(r.value);
    return String(r.value);
  };
  const cell = (r: PersonalRecord | undefined, other: PersonalRecord | undefined, path: string) => {
    // Perfect KDAs compare as equal-best; otherwise the higher value gets the mark.
    const best = r && (!other || r.value > other.value || (r.id === 'kda' && r.p.deaths === 0 && other.p.deaths !== 0));
    return (
      <td className="px-2 py-1.5 text-right">
        {r ? (
          <Link to={`${path}#m-${r.match.id}`} className={clsx('num inline-flex items-center gap-1.5 whitespace-nowrap hover:underline', best ? 'font-semibold text-gold' : 'text-text')}>
            <GameImg src={assets(sd).champion(r.p.championId).url} alt="" size={18} rounded="sm" />
            {show(r)}
          </Link>
        ) : (
          <span className="text-faint">–</span>
        )}
      </td>
    );
  };
  return (
    <section className="panel p-4" aria-labelledby="cmp-best-h">
      <h2 id="cmp-best-h" className="panel-title">
        {t('cmp.bestTitle')}
      </h2>
      <p className="mt-0.5 text-xs text-muted">{t('cmp.bestLead')}</p>
      <table className="mt-2 w-full text-sm">
        <thead className="text-xs text-muted">
          <tr>
            <th scope="col" className="sr-only">{t('cmp.bestRecord')}</th>
            <th scope="col" className="px-2 py-1 text-right font-medium">{pa.account.gameName}</th>
            <th scope="col" className="px-2 py-1 text-right font-medium">{pb.account.gameName}</th>
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => {
            const ra = as.find((r) => r.id === id);
            const rb = bs.find((r) => r.id === id);
            return (
              <tr key={id} className="border-t border-line">
                <th scope="row" className="py-1.5 pr-2 text-left font-normal text-muted">{t(`rec.${id}` as 'rec.kills')}</th>
                {cell(ra, rb, profilePath(pa.platform, pa.account))}
                {cell(rb, ra, profilePath(pb.platform, pb.account))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Legend({ nameA, nameB }: { nameA: string; nameB: string }) {
  return (
    <p className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted" aria-hidden>
      {[nameA, nameB].map((n, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: i === 0 ? 'var(--series-1)' : 'var(--series-2)' }} />
          {n}
        </span>
      ))}
    </p>
  );
}

function Champions({ a, b, nameA, nameB }: { a: PlayerSummary; b: PlayerSummary; nameA: string; nameB: string }) {
  const shared = new Set(a.ov.champions.map((c) => c.championId).filter((id) => b.ov.champions.some((c) => c.championId === id)));
  return (
    <section className="panel p-4" aria-labelledby="cmp-c-h">
      <h2 id="cmp-c-h" className="panel-title">
        {t('cmp.topChamps')}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <ChampList s={a} name={nameA} color="var(--series-1)" shared={shared} />
        <ChampList s={b} name={nameB} color="var(--series-2)" shared={shared} />
      </div>
      {shared.size > 0 && <p className="mt-3 text-xs text-faint">{t('cmp.sharedNote')}</p>}
    </section>
  );
}

function ChampList({ s, name, color, shared }: { s: PlayerSummary; name: string; color: string; shared: Set<number> }) {
  const { data: sd } = useStaticData();
  const as = assets(sd);
  return (
    <div className="min-w-0">
      <p className="mb-1.5 flex items-center gap-1.5 truncate text-xs text-muted">
        <span className="size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
        {name}
      </p>
      <ul className="space-y-1.5">
        {s.ov.champions.slice(0, 5).map((c) => {
          const ch = as.champion(c.championId);
          const slug = sd?.champions.get(c.championId)?.id;
          const ratio = kdaRatio(c.kills, c.deaths, c.assists);
          return (
            <li key={c.championId} className="flex items-center gap-2 text-sm">
              <GameImg src={ch.url} alt="" size={24} rounded="sm" className={clsx(shared.has(c.championId) && 'ring-2 ring-gold/70')} />
              <span className="min-w-0 flex-1">
                <Link to={slug ? `/champions/${champSlug(slug)}` : '#'} className="block truncate leading-tight hover:text-gold">
                  {ch.name}
                </Link>
                <span className="num block text-[11px] leading-tight text-muted">
                  {t('common.games', { count: c.games })} · <span className={kdaTone(ratio)}>{formatKda(ratio)}</span>
                </span>
              </span>
              <span className={clsx('num text-xs font-semibold', wlTone(c.wins / c.games, c.games))}>{pct(c.wins / c.games, 0)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
