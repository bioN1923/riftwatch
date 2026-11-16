import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { keepWhile } from '../lib/keepWhile';
import clsx from 'clsx';
import { callText } from '../lib/matchupText';
import { callTone, matchupCall } from '../lib/matchupVerdict';
import { ArrowLeftRight } from 'lucide-react';
import type { MatchupStats } from '../../shared/types';
import { api, ApiClientError } from '../lib/api';
import { assets, championBySlug, champSlug, matchupPath, useStaticData } from '../lib/ddragon';
import { formatKda, pct, thousands } from '../lib/format';
import { fadeIn } from '../lib/motion';
import { GameImg } from '../components/ui/GameImg';
import { ROLE_LABEL } from '../components/ui/RoleIcon';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { PatchSelect, RoleTab } from '../components/champions/common';
import { SlidingIndicator } from '../components/ui/Motion';
import { LaneCurve } from '../components/champions/LaneCurve';
import { BuildGlance, ItemsBlock, Lead, LOW_SAMPLE, RunesBlock, SpellsAndStart } from './Champion';
import { t } from '../i18n';
import { guessChampion } from '../lib/champSearch';
import { PatchHistory } from '../components/champions/PatchHistory';

export function MatchupPage() {
  const { slug = '', opp = '' } = useParams();
  const { data: sd, isPending } = useStaticData();
  const a = championBySlug(sd, slug);
  const b = championBySlug(sd, opp);
  const { search } = useLocation();

  if (isPending) return <Skeleton className="m-4 h-72" />;
  if (!a || !b || a.key === b.key) {
    // Each side may be a nickname or a typo: go straight there when sure, otherwise suggest.
    const list = sd ? [...sd.champions.values()] : [];
    const side = (s: string, found?: { id: string; name: string }) => (found ? { champ: found, sure: true } : guessChampion(s, list));
    const ga = side(slug, a);
    const gb = side(opp, b);
    const fixed = ga && gb && ga.champ.id !== gb.champ.id ? `/champions/${champSlug(ga.champ.id)}/vs/${champSlug(gb.champ.id)}${search}` : null;
    if (fixed && ga?.sure && gb?.sure) return <Navigate replace to={fixed} />;
    document.title = `${t('mp.notFound')} · Riftwatch`;
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorState
          page
          title={t('mp.notFound')}
          error={new ApiClientError(404, 'NOT_FOUND', t('mp.notFoundBody'))}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {fixed && ga && gb && (
                <Link to={fixed} className="rounded bg-gold px-4 py-2 font-semibold text-gold-ink">
                  {t('mp.didYouMean', { a: ga.champ.name, b: gb.champ.name })}
                </Link>
              )}
              <Link to="/champions" className={fixed ? 'rounded border border-line px-4 py-2 font-semibold hover:bg-surface' : 'rounded bg-gold px-4 py-2 font-semibold text-gold-ink'}>
                {t('cp.browse')}
              </Link>
            </div>
          }
        />
      </div>
    );
  }
  return <MatchupView key={`${a.key}-${b.key}`} championId={a.key} opponentId={b.key} />;
}

function MatchupView({ championId, opponentId }: { championId: number; opponentId: number }) {
  const [params, setParams] = useSearchParams();
  const role = params.get('role') ?? undefined;
  const patch = params.get('patch') ?? undefined;
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const me = sd?.champions.get(championId);
  const them = sd?.champions.get(opponentId);

  const muKey = ['matchup', championId, opponentId, role, patch] as const;
  const q = useQuery({
    queryKey: muKey,
    queryFn: ({ signal }) => api.matchup(championId, opponentId, { role, patch }, signal),
    staleTime: 60_000,
    // Changing lane or patch keeps this matchup on screen (dimmed) instead of flashing skeletons.
    placeholderData: keepWhile(muKey, 1, 2),
  });
  const m = q.data;
  // The glance strip follows the rune page picked in the runes block.
  const [runePage, setRunePage] = useState(0);
  useEffect(() => setRunePage(0), [championId, opponentId, m?.role, m?.patch]);

  useEffect(() => {
    if (me && them) document.title = t('mp.title', { a: me.name, b: them.name });
  }, [me, them]);

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null) next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };

  const roleName = m ? (ROLE_LABEL[m.role] ?? m.role) : '';

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        {/* Two splashes meeting in the middle. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-2">
          {[championId, opponentId].map((id, i) => (
            <div key={id} className="relative overflow-hidden">
              <img
                src={a.fullSplash(id)}
                alt=""
                {...fadeIn('splash')}
                className={clsx('h-full w-full object-cover opacity-40', i === 0 ? 'object-[70%_20%]' : 'object-[30%_20%] -scale-x-100')}
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-surface/30" />
          <div className="absolute inset-y-0 left-1/2 w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-surface/70 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-8">
          <Link to={me ? `/champions/${champSlug(me.id)}${role ? `?role=${role}` : ''}` : '/champions'} className="text-sm text-muted hover:text-text">
            ← {me?.name ?? t('pc.fallback')}
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Side id={championId} />
            <span className="font-display text-2xl font-bold text-faint">vs</span>
            <Side id={opponentId} />
            <Link
              to={matchupPath(sd, opponentId, championId, m?.role ?? role)}
              className="ml-auto inline-flex items-center gap-2 rounded border border-line-strong bg-surface/70 px-3 py-1.5 text-sm font-medium backdrop-blur transition-colors hover:border-gold hover:text-gold"
              title={t('mp.otherSide', { champion: them?.name ?? '' })}
            >
              <ArrowLeftRight className="size-4" aria-hidden />
              {t('mp.vs', { a: them?.name ?? '', b: me?.name ?? '' })}
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted">
            {m ? t('mp.lane', { role: roleName }) : ' '}
            {m?.patch ? ` · ${t('patch.value', { patch: m.patch })}` : ''} · {t('mp.ranked')}
          </p>

          {m && <Verdict m={m} me={me?.name ?? ''} them={them?.name ?? ''} />}

          <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
            {m && m.roles.length > 1 ? (
              <div role="tablist" aria-label={t('tl.role')} className="relative flex gap-5 overflow-x-auto overflow-y-hidden">
                <SlidingIndicator />
                {m.roles.map((r) => (
                  <RoleTab key={r.role} role={r.role} active={(q.isPlaceholderData && role ? role : m.role) === r.role} onClick={() => set('role', r.role)}>
                    {ROLE_LABEL[r.role] ?? r.role} <span className="num text-faint">{thousands(r.games)}</span>
                  </RoleTab>
                ))}
              </div>
            ) : (
              <span />
            )}
            {m && <PatchSelect patches={m.patches} value={m.patch} onChange={(p) => set('patch', p)} />}
          </div>
          <div className="h-3" />
        </div>
      </section>

      <div className={clsx('mx-auto max-w-6xl space-y-5 px-4 py-5 transition-opacity duration-200', q.isPlaceholderData && 'pointer-events-none opacity-60')} aria-busy={q.isPlaceholderData}>
        {q.isPending ? (
          <Skeleton className="h-96" />
        ) : q.isError || !m ? (
          <ErrorState error={q.error} />
        ) : m.games === 0 ? (
          <div className="panel">
            <EmptyState title={t('mp.noGames', { a: me?.name ?? '', b: them?.name ?? '' })}>
              {t('mp.noGamesBody')}
            </EmptyState>
          </div>
        ) : (
          <>
            {m.lane && (
              <LaneCurve
                lane={m.lane}
                sub={t('mp.laneSub', { a: me?.name ?? '', b: them?.name ?? '', count: m.lane.games })}
                note={m.lane.games < m.games ? t('mp.laneEarly', { count: m.games }) : undefined}
              />
            )}
            <section className="panel panel-tick p-5" aria-labelledby="mu-build-h">
              <h2 id="mu-build-h" className="panel-title text-2xl">
                {t('mp.howTo', { a: me?.name ?? '', b: them?.name ?? '' })}
              </h2>
              <p className="text-xs text-muted">{t('mp.howToSub')}</p>
              {m.games < 30 && (
                <p className="mt-3 rounded border border-kda-great/40 bg-kda-great/10 px-3 py-2 text-sm">
                  {t('mp.early', { count: m.games, min: LOW_SAMPLE })}
                </p>
              )}
              <div className="mt-5 space-y-7">
                <BuildGlance s={m} page={runePage} />
                <RunesBlock s={m} page={runePage} onPage={setRunePage} />
                <SpellsAndStart s={m} />
                <ItemsBlock s={m} />
              </div>
            </section>
          </>
        )}

        {m && (m.history?.length ?? 0) >= 2 && <PatchHistory history={m.history} current={m.patch} />}

        {m && m.others.length > 0 && (
          <section className="panel p-5" aria-labelledby="mu-others-h">
            <h2 id="mu-others-h" className="panel-title">
              {t('mp.others', { role: roleName.toLowerCase(), champion: me?.name ?? '' })}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {m.others.map((o) => {
                const c = a.champion(o.championId);
                const low = o.games < LOW_SAMPLE;
                return (
                  <li key={o.championId}>
                    <Link
                      to={matchupPath(sd, championId, o.championId, m.role)}
                      className="group flex items-center gap-2 rounded border border-line bg-raised/40 py-1 pl-1 pr-2.5 transition-colors hover:border-line-strong hover:bg-raised"
                    >
                      <GameImg src={c.url} alt="" size={28} rounded="sm" />
                      <span className="text-sm font-medium group-hover:text-gold">{c.name}</span>
                      <span className={clsx('num text-xs font-semibold', low ? 'text-faint' : o.winRate >= 0.5 ? 'text-win' : 'text-loss')}>{pct(o.winRate)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function Side({ id }: { id: number }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const c = sd?.champions.get(id);
  return (
    <Link to={c ? `/champions/${champSlug(c.id)}` : '#'} className="group flex items-center gap-3">
      <GameImg src={a.champion(id).url} alt="" size={64} rounded="md" className="ring-1 ring-line-strong" />
      <span className="font-display text-4xl font-extrabold leading-none tracking-tight group-hover:text-gold sm:text-5xl">{c?.name ?? '…'}</span>
    </Link>
  );
}

/** The headline: who's favoured, by how much, and the laning picture. */
function Verdict({ m, me, them }: { m: MatchupStats; me: string; them: string }) {
  const low = m.games < LOW_SAMPLE;
  const call = matchupCall(m);
  const verdict = callText(call, me, them);
  const vsUsual = m.baseline ? m.winRate - m.baseline.winRate : null;
  const tile = (label: string, value: React.ReactNode, note?: React.ReactNode) => (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="display-num mt-0.5 text-2xl font-bold leading-none">{value}</p>
      {note && <p className="mt-1 text-xs text-faint">{note}</p>}
    </div>
  );
  return (
    <div className="mt-5">
      <p className={clsx('font-display text-xl font-bold', callTone(call))}>{verdict}</p>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
        {tile(
          t('mp.wr', { champion: me }),
          <span className={clsx(low ? 'text-faint' : callTone(call))}>
            {pct(m.winRate, 1)}
            {low && '*'}
          </span>,
          t('common.games', { count: m.games }),
        )}
        {tile(
          t('mp.vsUsual'),
          vsUsual == null ? '–' : <Lead v={vsUsual * 100} unit="%" decimals={1} />,
          m.baseline ? t('mp.averages', { champion: me, rate: pct(m.baseline.winRate, 1) }) : undefined,
        )}
        {tile(t('mp.gold15'), <Lead v={m.goldDiff15} unit="" />, t('mp.leadInLane'))}
        {tile(t('mp.cs15'), <Lead v={m.csDiff15} unit="" />)}
        {tile(t('mp.xp15'), <Lead v={m.xpDiff15} unit="" />)}
        {tile(t('mp.avgKda'), m.kda ? formatKda((m.kda.kills + m.kda.assists) / Math.max(1, m.kda.deaths)) : '–', m.kda ? `${m.kda.kills.toFixed(1)} / ${m.kda.deaths.toFixed(1)} / ${m.kda.assists.toFixed(1)}` : undefined)}
      </div>
    </div>
  );
}

/** How the lane develops: average gold and CS lead over the opponent at 5, 10 and 15 minutes. */
