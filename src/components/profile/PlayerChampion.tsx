import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import type { MatchSummary } from '../../../shared/types';
import { api } from '../../lib/api';
import { assets, champSlug, isCompletedItem, matchupPath, useStaticData } from '../../lib/ddragon';
import { formatKda, kdaRatio, kdaTone, pct, timeAgo, winRateTone, TONE_MIN_GAMES } from '../../lib/format';
import { playerChampion } from '../../lib/playerChampion';
import { GameImg } from '../ui/GameImg';
import { ItemTip } from '../ui/ItemTip';
import { ROLE_LABEL } from '../ui/RoleIcon';
import { Tip } from '../match/Loadout';
import { t } from '../../i18n';

/**
 * A player's record on one champion, next to the average for that champion in the same
 * role. Opens as a dialog (a bottom sheet on phones) over the profile.
 */
export function PlayerChampionDialog({
  matches,
  puuid,
  name,
  championId,
  hasMore,
  loadingMore,
  onLoadMore,
  onClose,
}: {
  matches: MatchSummary[];
  puuid: string;
  name: string;
  championId: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const champ = sd?.champions.get(championId);
  const pc = useMemo(() => playerChampion(matches, puuid, championId, (id) => isCompletedItem(sd, id)), [matches, puuid, championId, sd]);
  const role = pc?.mainRole ?? undefined;
  const avgQ = useQuery({
    queryKey: ['champion', championId, 'ranked', role, undefined],
    queryFn: ({ signal }) => api.champion(championId, { group: 'ranked', role }, signal),
    staleTime: 5 * 60_000,
  });
  const avg = avgQ.data?.avg && avgQ.data.role === (role ?? avgQ.data.role) ? avgQ.data : undefined;

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const ratio = pc ? kdaRatio(pc.kills, pc.deaths, pc.assists) : 0;
  const wr = pc ? pc.wins / pc.games : 0;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-labelledby="pc-title"
      className="pc-dialog m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-xl border border-line-strong bg-surface p-0 text-text shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-[2px] sm:m-auto sm:max-h-[86dvh] sm:max-w-2xl sm:rounded-xl"
    >
      <div className="flex max-h-[inherit] flex-col">
        <header className="relative flex items-center gap-4 border-b border-line px-5 py-4">
          <GameImg src={a.champion(championId).url} alt="" size={56} rounded="md" className="ring-1 ring-line-strong" />
          <div className="min-w-0 flex-1">
            <h2 id="pc-title" className="truncate font-display text-3xl font-extrabold leading-none">
              {champ?.name ?? t('pc.fallback')}
            </h2>
            <p className="mt-1 truncate text-sm text-muted">
              {name}
              {pc && (
                <>
                  {role && ` · ${ROLE_LABEL[role] ?? role}`} · {t('common.games', { count: pc.games })}
                </>
              )}
            </p>
          </div>
          <button onClick={() => ref.current?.close()} aria-label={t('pc.close')} className="grid size-9 place-items-center rounded text-muted hover:bg-raised hover:text-text">
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4">
          {!pc ? (
            <p className="py-6 text-center text-sm text-muted">{t('pc.none')}</p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <Big label={t('pc.winRate')} value={<span className={winRateTone(wr, pc.games)}>{pct(wr)}</span>} note={`${t('common.wins', { count: pc.wins })} ${t('common.losses', { count: pc.games - pc.wins })}`} />
                <Big
                  label={t('pc.kda')}
                  value={<span className={kdaTone(ratio)}>{formatKda(ratio)}</span>}
                  note={`${(pc.kills / pc.games).toFixed(1)} / ${(pc.deaths / pc.games).toFixed(1)} / ${(pc.assists / pc.games).toFixed(1)}`}
                />
                <Big label={t('pc.killShare')} value={pct(pc.killShare)} note={t('pc.visionMin', { value: pc.visionPerMin.toFixed(2) })} />
              </div>

              <section aria-labelledby="pc-cmp">
                <h3 id="pc-cmp" className="mb-2 font-display text-lg font-bold">
                  {t('pc.compare', { champion: champ?.name ?? '' })}
                </h3>
                {avg?.avg && avg.summary ? (
                  <>
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted">
                      <tr>
                        <th className="pb-1.5 text-left font-medium" scope="col">
                          <span className="sr-only">{t('pc.stat')}</span>
                        </th>
                        <th className="pb-1.5 text-right font-medium" scope="col">
                          {name}
                        </th>
                        <th className="pb-1.5 text-right font-medium" scope="col">
                          {role ? t('pc.averageRole', { role: ROLE_LABEL[role] ?? role }) : t('pc.average')}
                        </th>
                        <th className="w-16 pb-1.5" scope="col">
                          <span className="sr-only">{t('pc.diff')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="num">
                      <Cmp games={pc.games} rate label={t('pc.row.wr')} mine={wr} avg={avg.summary.winRate} fmt={(v) => pct(v, 1)} />
                      <Cmp games={pc.games} label={t('pc.row.kills')} mine={pc.kills / pc.games} avg={avg.avg.kills} fmt={(v) => v.toFixed(1)} />
                      <Cmp games={pc.games} label={t('pc.row.deaths')} mine={pc.deaths / pc.games} avg={avg.avg.deaths} fmt={(v) => v.toFixed(1)} lowerIsBetter />
                      <Cmp games={pc.games} label={t('pc.row.assists')} mine={pc.assists / pc.games} avg={avg.avg.assists} fmt={(v) => v.toFixed(1)} />
                      <Cmp games={pc.games} label={t('pc.row.cs')} mine={pc.csPerMin} avg={avg.avg.csPerMin} fmt={(v) => v.toFixed(1)} />
                      <Cmp games={pc.games} label={t('pc.row.dmg')} mine={pc.damagePerMin} avg={avg.avg.damagePerMin} fmt={(v) => v.toFixed(0)} />
                      <Cmp games={pc.games} label={t('pc.row.gold')} mine={pc.goldPerMin} avg={avg.avg.goldPerMin} fmt={(v) => v.toFixed(0)} />
                    </tbody>
                  </table>
                  {pc.games < CMP_SURE_GAMES && <p className="mt-2 text-xs text-faint">{t('pc.fewGames', { count: pc.games })}</p>}
                  </>
                ) : (
                  <p className="text-sm text-muted">{avgQ.isPending ? t('pc.loadingAvg') : t('pc.noAvg')}</p>
                )}
              </section>

              <div className="grid gap-6 sm:grid-cols-2">
                {pc.items.length > 0 && (
                  <section aria-labelledby="pc-items">
                    <h3 id="pc-items" className="mb-2 font-display text-lg font-bold">
                      {t('pc.items')}
                    </h3>
                    <ul className="grid grid-cols-3 gap-2">
                      {pc.items.map((it) => (
                        <li key={it.id} className="flex flex-col items-center gap-1 text-center">
                          <GameImg src={a.item(it.id).url} alt={a.item(it.id).name} size={36} rounded="sm" tip={<ItemTip id={it.id} />} />
                          <span className="num text-[11px] text-muted">
                            {it.games}× · <span className={winRateTone(it.wins / it.games, it.games)}>{pct(it.wins / it.games)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <section aria-labelledby="pc-runes">
                  <h3 id="pc-runes" className="mb-2 font-display text-lg font-bold">
                    {t('pc.runes')}
                  </h3>
                  <ul className="space-y-1.5">
                    {pc.keystones.map((k) => {
                      const r = a.rune(k.id);
                      const tree = sd?.trees.find((t) => t.id === k.secondaryStyle);
                      return (
                        <li key={`${k.id}-${k.secondaryStyle}`} className="flex items-center gap-2 text-sm">
                          <GameImg src={r.url} alt={r.name} size={26} rounded="full" className="bg-[#0e1b1d]!" tip={r.name ? <Tip title={r.name} body={r.desc} /> : undefined} />
                          {tree && <GameImg src={`https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`} alt={tree.name} size={18} rounded="full" tip={tree.name} />}
                          <span className="min-w-0 flex-1 truncate">{r.name}</span>
                          <Record games={k.games} wins={k.wins} />
                        </li>
                      );
                    })}
                    {pc.spells.map((s) => (
                      <li key={s.ids.join()} className="flex items-center gap-2 text-sm">
                        <span className="flex gap-0.5">
                          {s.ids.map((id) => {
                            const x = a.spell(id);
                            return <GameImg key={id} src={x.url} alt={x.name} size={22} rounded="sm" tip={x.name ? <Tip title={x.name} body={x.description} /> : undefined} />;
                          })}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-muted">{s.ids.map((id) => a.spell(id).name).join(' + ')}</span>
                        <Record games={s.games} wins={s.wins} />
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {pc.opponents.length > 0 && (
                <section aria-labelledby="pc-opps">
                  <h3 id="pc-opps" className="mb-2 font-display text-lg font-bold">
                    {t('pc.opponents')}
                  </h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {pc.opponents.map((o) => {
                      const c = a.champion(o.championId);
                      return (
                        <li key={o.championId}>
                          <Link
                            to={matchupPath(sd, championId, o.championId, role)}
                            className="group flex items-center gap-2 rounded border border-line bg-raised/40 py-1 pl-1 pr-2.5 transition-colors hover:border-line-strong hover:bg-raised"
                            title={t('pc.vsTitle', { a: champ?.name ?? '', b: c.name })}
                          >
                            <GameImg src={c.url} alt="" size={24} rounded="sm" />
                            <span className="text-sm group-hover:text-gold">{c.name}</span>
                            <span className="num text-xs">
                              <span className="text-win">{t('common.wins', { count: o.wins })}</span> <span className="text-loss">{t('common.losses', { count: o.games - o.wins })}</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              <section aria-labelledby="pc-recent">
                <h3 id="pc-recent" className="mb-2 font-display text-lg font-bold">
                  {t('pc.recent')}
                </h3>
                <ul className="space-y-1">
                  {pc.recent.map(({ match: m, p, opponent }) => {
                    const r = kdaRatio(p.kills, p.deaths, p.assists);
                    return (
                      <li key={m.id} className={clsx('flex items-center gap-3 rounded border-l-[3px] bg-raised/40 px-3 py-1.5 text-sm', p.win ? 'border-win' : 'border-loss')}>
                        <span className={clsx('w-9 shrink-0 text-xs font-semibold', p.win ? 'text-win' : 'text-loss')}>{p.win ? t('pc.win') : t('pc.loss')}</span>
                        <span className="num w-24 shrink-0">
                          {p.kills}/<span className="text-loss">{p.deaths}</span>/{p.assists}
                          <span className={clsx('ml-1.5 text-xs', kdaTone(r))}>{formatKda(r)}</span>
                        </span>
                        {opponent && (
                          <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
                            {t('pc.vs')} <GameImg src={a.champion(opponent.championId).url} alt={a.champion(opponent.championId).name} size={20} rounded="sm" />
                          </span>
                        )}
                        <span className="ml-auto flex gap-0.5">
                          {p.items.slice(0, 6).map((id, i) => (
                            <GameImg key={i} src={id ? a.item(id).url : undefined} alt={id ? a.item(id).name : ''} size={20} rounded="sm" tip={id ? <ItemTip id={id} /> : undefined} />
                          ))}
                        </span>
                        <span className="hidden w-16 shrink-0 text-right text-xs text-faint sm:block">{timeAgo(m.startedAt + m.duration * 1000)}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-3 text-sm">
          <span className="text-xs text-faint">{t('pc.from', { count: matches.length })}</span>
          {hasMore && (
            <button onClick={onLoadMore} disabled={loadingMore} className="rounded border border-line-strong px-2.5 py-1 text-xs font-medium hover:bg-raised disabled:opacity-50">
              {loadingMore ? t('common.loading') : t('pc.loadMore')}
            </button>
          )}
          {champ && (
            <Link to={`/champions/${champSlug(champ.id)}${role ? `?role=${role}` : ''}`} className="ml-auto font-medium text-gold hover:underline">
              {t('pc.buildsLink', { champion: champ.name })}
            </Link>
          )}
        </footer>
      </div>
    </dialog>
  );
}

function Big({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="rounded border border-line bg-raised/40 px-3 py-2.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="display-num mt-0.5 text-2xl font-bold leading-none">{value}</p>
      {note && <p className="num mt-1 text-xs text-faint">{note}</p>}
    </div>
  );
}

function Record({ games, wins }: { games: number; wins: number }) {
  return (
    <span className="num shrink-0 text-xs text-muted">
      {games}× · <span className={winRateTone(wins / games, games)}>{pct(wins / games)}</span>
    </span>
  );
}

/** Below this many games on the champion, per-game gaps (kills, CS…) aren't coloured: a few games swing them a lot. */
const CMP_SURE_GAMES = 10;

function Cmp(props: { label: string; mine: number; avg: number; fmt: (v: number) => string; lowerIsBetter?: boolean; games: number; rate?: boolean }) {
  const { label, mine, avg, fmt, lowerIsBetter, games, rate } = props;
  const diff = avg ? (mine - avg) / avg : 0;
  const up = lowerIsBetter ? diff < -0.03 : diff > 0.03;
  const down = lowerIsBetter ? diff > 0.03 : diff < -0.03;
  // Colour only gaps we can be fairly sure of: the win rate by a two-standard-error test against the
  // champion's average, the per-game stats once there are enough games. Otherwise the arrow stays grey.
  const sure = rate ? games >= TONE_MIN_GAMES && Math.abs(mine - avg) > 2 * Math.sqrt(Math.max(avg * (1 - avg), 0.01) / games) : games >= CMP_SURE_GAMES;
  const better = up && sure;
  const worse = down && sure;
  return (
    <tr className="border-t border-line">
      <th scope="row" className="py-1.5 text-left font-normal text-muted">
        {label}
      </th>
      <td className={clsx('py-1.5 text-right font-semibold', better ? 'text-win' : worse ? 'text-loss' : 'text-text')}>{fmt(mine)}</td>
      <td className="py-1.5 text-right text-muted">{fmt(avg)}</td>
      <td className="py-1.5 pl-2 text-right text-xs">
        {up || down ? (
          <span className={clsx('inline-flex items-center gap-0.5', better ? 'text-win' : worse ? 'text-loss' : 'text-muted')} aria-label={up ? t('pc.better') : t('pc.worse')}>
            {mine > avg ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />}
            {Math.round(Math.abs(diff) * 100)}%
          </span>
        ) : (
          <span className="text-faint">≈</span>
        )}
      </td>
    </tr>
  );
}
