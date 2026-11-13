import { useId, useState } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import type { MatchSummary, Participant } from '../../../shared/types';
import { assets, champSlug, useStaticData } from '../../lib/ddragon';
import { compact, duration, formatKda, kdaRatio, kdaTone, multikill, pct, timeAgo } from '../../lib/format';
import { queueName } from '../../lib/queues';
import { profilePath } from '../../lib/riotId';
import { result } from '../../lib/stats';
import { GameImg } from '../ui/GameImg';
import { Items, SpellsRunes } from './Loadout';
import { MatchDetails } from './MatchDetails';
import { fadeIn } from '../../lib/motion';
import { Collapse } from '../ui/Motion';
import { getLang, t } from '../../i18n';

const resultLabel = (r: 'win' | 'loss' | 'remake') => t(`result.${r}`);

export function Badge({ p }: { p: Participant }) {
  if (p.badge === 'MVP') return <span className="rounded-sm bg-gold px-1.5 py-px font-sans text-[10px] font-bold text-gold-ink">MVP</span>;
  if (p.badge === 'ACE') return <span className="rounded-sm border border-line-strong px-1.5 font-sans text-[10px] font-bold text-muted">ACE</span>;
  return null;
}

export function MatchRow({ match, puuid, platform }: { match: MatchSummary; puuid: string; platform: string }) {
  const { data } = useStaticData();
  const a = assets(data);
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const p = match.participants.find((x) => x.puuid === puuid);
  if (!p) return null;

  const r = result(match, p);
  const champ = a.champion(p.championId);
  const ratio = kdaRatio(p.kills, p.deaths, p.assists);
  const minutes = match.duration / 60;
  const arena = match.queueId === 1700 || match.queueId === 1710;
  const teams = arena ? [] : [100, 200].map((t) => match.participants.filter((x) => x.teamId === t));
  const ended = match.startedAt + match.duration * 1000;
  const splash = a.splash(p.championId);

  return (
    <article
      id={`m-${match.id}`}
      aria-label={t('match.aria', { result: resultLabel(r), champion: champ.name, queue: queueName(match.queueId), ago: timeAgo(ended) })}
      className={clsx(
        'group/card scroll-mt-20 overflow-hidden rounded border bg-surface transition-colors duration-200',
        open ? 'border-line-strong' : 'border-line hover:border-line-strong',
      )}
    >
      <div className="flex">
        {/* Splash column: who you played, and how it went */}
        <div className="relative w-[92px] shrink-0 overflow-hidden sm:w-[132px]">
          {splash && <img src={splash} alt="" loading="lazy" {...fadeIn('splash')} className="absolute inset-0 h-full w-full object-cover object-[center_20%] group-hover/card:scale-105" onError={(e) => (e.currentTarget.style.display = 'none')} />}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surface/30 to-surface" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/95 via-surface/10 to-transparent" />
          <div className={clsx('absolute inset-y-0 left-0 w-[3px]', r === 'win' ? 'bg-win' : r === 'loss' ? 'bg-loss' : 'bg-faint')} />
          <div className="relative flex h-full flex-col justify-between p-2.5 pl-3.5">
            <span
              className={clsx(
                'w-max rounded-sm px-1.5 py-0.5 font-display text-sm font-extrabold leading-none tracking-wide',
                r === 'win' ? 'bg-win text-bg' : r === 'loss' ? 'bg-loss text-bg' : 'bg-faint text-bg',
              )}
            >
              {arena && p.placement ? ordinal(p.placement) : resultLabel(r)}
            </span>
            <div>
              <Link
                to={data?.champions.get(p.championId) ? `/champions/${champSlug(data.champions.get(p.championId)!.id)}${p.position ? `?role=${p.position}` : ''}` : '#'}
                className="block truncate font-display text-lg font-bold leading-tight text-text drop-shadow transition-colors hover:text-gold"
              >
                {champ.name}
              </Link>
              <p className="num text-[11px] text-muted">{t('match.level', { level: p.champLevel })}</p>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-x-5 gap-y-2.5 p-3 xl:flex-nowrap">
          <div className="min-w-0 flex-1 space-y-2.5">
            {/* Wraps between the pieces, never inside one ("4 days" / "ago" on separate lines on phones). */}
            <p className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-muted">
              <span className="whitespace-nowrap font-medium text-text">{queueName(match.queueId)}</span>
              <span className="text-faint" aria-hidden>
                /
              </span>
              <span className="num whitespace-nowrap">{duration(match.duration)}</span>
              <span className="text-faint" aria-hidden>
                /
              </span>
              <span className="whitespace-nowrap">{timeAgo(ended)}</span>
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <SpellsRunes p={p} a={a} size={22} />
              <div>
                <p className="display-num text-[28px] font-extrabold leading-none">
                  {p.kills}
                  <span className="mx-1 text-faint">/</span>
                  <span className="text-loss">{p.deaths}</span>
                  <span className="mx-1 text-faint">/</span>
                  {p.assists}
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs">
                  <span className={clsx('num font-semibold', kdaTone(ratio))}>{t('common.kdaValue', { value: formatKda(ratio) })}</span>
                  <Badge p={p} />
                  {p.largestMultiKill >= 2 && (
                    <span className={clsx('rounded-sm px-1.5 py-px text-[10px] font-bold', p.largestMultiKill >= 4 ? 'bg-kda-great text-bg' : 'bg-raised text-text')}>
                      {multikill(p.largestMultiKill)}
                    </span>
                  )}
                </p>
              </div>
              <dl className="hidden grid-cols-2 gap-x-4 gap-y-0.5 text-xs md:grid">
                <Stat label={t('match.killShare')} value={pct(p.killParticipation)} />
                <Stat label={t('match.cs')} value={`${p.cs} · ${(p.cs / minutes).toFixed(1)}/m`} />
                <Stat label={t('match.damage')} value={compact(p.damage)} />
                <Stat label={t('match.vision')} value={String(p.visionScore)} />
              </dl>
            </div>

            <Items items={p.items} size={24} />
          </div>

          {teams.length > 0 && (
            <div className="hidden shrink-0 grid-cols-2 gap-x-3 border-l border-line pl-4 xl:grid" role="group" aria-label={t('match.players')}>
              {teams.map((team, ti) => (
                <ul key={ti} className="space-y-[3px]">
                  {team.map((x) => {
                    const c = a.champion(x.championId);
                    const self = x.puuid === puuid;
                    return (
                      <li key={x.puuid + x.championId} className="flex items-center gap-1.5 text-xs">
                        <GameImg src={c.url} alt={c.name} size={16} rounded="sm" className={ti === 0 ? 'ring-1 ring-side-blue/50' : 'ring-1 ring-side-red/50'} />
                        {self ? (
                          <span className="w-[70px] truncate font-semibold text-text">{x.gameName}</span>
                        ) : x.hidden ? (
                          <span className="w-[70px] truncate italic text-faint">{t('live.hidden')}</span>
                        ) : (
                          <Link to={profilePath(platform, x)} className="w-[70px] truncate text-muted hover:text-text hover:underline" title={`${x.gameName}#${x.tagLine}`}>
                            {x.gameName}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={detailsId}
          aria-label={open ? t('match.hide') : t('match.show')}
          className="flex w-10 shrink-0 items-center justify-center border-l border-line text-muted transition-colors hover:bg-raised hover:text-gold"
        >
          <ChevronDown className={clsx('size-5 transition-transform duration-[420ms]', open && 'rotate-180')} aria-hidden />
        </button>
      </div>

      <Collapse open={open} id={detailsId}>
        <MatchDetails match={match} puuid={puuid} platform={platform} />
      </Collapse>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="num font-medium text-text">{value}</dd>
    </div>
  );
}

export function ordinal(n: number) {
  if (getLang() !== 'en') return t('common.ordinal', { n: String(n) });
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
