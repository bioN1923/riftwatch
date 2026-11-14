import { useState } from 'react';
import clsx from 'clsx';
import { Skull, Swords, Handshake, Castle, Crown } from 'lucide-react';
import type { MatchSummary, MatchTimeline, TimelineEvent } from '../../../../shared/types';
import { assets, useStaticData } from '../../../lib/ddragon';
import { GameImg } from '../../ui/GameImg';
import { GoldChart, objectiveLabel } from '../../charts/GoldChart';
import { fmtTime, PlayerPicker, SectionTitle, TimelineGate, useTimeline } from './shared';
import { t } from '../../../i18n';
import { happeningsNear, MAP_SIZE, objectivePos } from '../../../lib/mapEvents';
import { RANDOM_CHAMP_QUEUES } from '../../../lib/liveTags';


export function TimelineTab({ match, puuid, platform }: { match: MatchSummary; puuid: string; platform: string }) {
  const q = useTimeline(platform, match.id);
  const [who, setWho] = useState(puuid);
  return (
    <div className="space-y-6 p-4">
      <TimelineGate q={q}>
        {() => {
          const tl = q.data!;
          const side = tl.puuids.map((id) => match.participants.find((p) => p.puuid === id)?.teamId ?? 100);
          const diff = tl.frames.map((f) => f.gold.reduce((s, g, i) => s + (side[i] === 100 ? g : -g), 0));
          return (
            <>
              <section>
                <SectionTitle aside={t('tl.hover')}>{t('tl.goldLead')}</SectionTitle>
                <GoldChart diff={diff} events={tl.events} />
              </section>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <h3 className="font-display text-lg font-bold">{t('tl.events')}</h3>
                <PlayerPicker match={match} value={who} onChange={setWho} />
              </div>
              <PlayerTimeline match={match} tl={tl} who={who} />
            </>
          );
        }}
      </TimelineGate>
    </div>
  );
}

function PlayerTimeline({ match, tl, who }: { match: MatchSummary; tl: MatchTimeline; who: string }) {
  const [scope, setScope] = useState<'player' | 'all'>('player');
  const [sel, setSel] = useState<{ t: number; x: number; y: number } | null>(null);
  const { data } = useStaticData();
  const a = assets(data);
  const me = tl.puuids.indexOf(who);
  const myTeam = match.participants.find((p) => p.puuid === who)?.teamId ?? 100;
  const champAt = (i: number) => {
    const p = match.participants.find((x) => x.puuid === tl.puuids[i]);
    return p ? a.champion(p.championId) : { url: undefined, name: t('tl.minions') };
  };

  const kills = tl.events.filter((e): e is Extract<TimelineEvent, { type: 'kill' }> => e.type === 'kill');
  const mine = kills
    .map((e) => ({ e, role: e.killer === me ? 'kill' : e.victim === me ? 'death' : e.assists.includes(me) ? 'assist' : null }))
    .filter((x): x is { e: (typeof kills)[number]; role: 'kill' | 'death' | 'assist' } => x.role !== null);
  const feed = [
    ...mine.map(({ e, role }) => ({ t: e.t, kind: role, e })),
    ...tl.events.filter((e) => e.type === 'objective' && e.monster !== 'HORDE').map((e) => ({ t: e.t, kind: 'objective' as const, e })),
  ].sort((x, y) => x.t - y.t);

  const name = (i: number) => (i >= 0 ? champAt(i).name : t('tl.minions'));
  const sideOf = (i: number) => (i >= 0 ? (match.participants.find((x) => x.puuid === tl.puuids[i])?.teamId ?? 100) : 0);
  const allKills = kills.map((e) => ({ e, role: (e.killer === me ? 'kill' : e.victim === me ? 'death' : e.assists.includes(me) ? 'assist' : 'other') as 'kill' | 'death' | 'assist' | 'other' }));
  const dots = scope === 'player' ? mine : allKills;
  const objectives = tl.events.filter((e): e is Extract<TimelineEvent, { type: 'objective' }> => e.type === 'objective');
  const happenings = sel ? happeningsNear(tl.events, sel) : [];
  // ARAM is played on the Howling Abyss (map 12, about 12,900 units across), everything else here on the Rift.
  const aram = RANDOM_CHAMP_QUEUES.has(match.queueId);
  const size = aram ? 12900 : MAP_SIZE;
  const mapImg = a.map && aram ? a.map.replace('map11.png', 'map12.png') : a.map;
  const pos = (x: number, y: number) => [(x / size) * 100, 100 - (y / size) * 100] as const;
  const pick = (t0: number, x: number, y: number) => setSel((s) => (s && s.t === t0 && s.x === x && s.y === y ? null : { t: t0, x, y }));
  const keys = (t0: number, x: number, y: number) => (ev: React.KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      pick(t0, x, y);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,300px)_1fr]">
      <figure>
        <div role="radiogroup" aria-label={t('tl.mapScope')} className="mb-2 inline-flex rounded border border-line p-0.5 text-xs">
          {(['player', 'all'] as const).map((k) => (
            <button
              key={k}
              role="radio"
              aria-checked={scope === k}
              onClick={() => {
                setScope(k);
                setSel(null);
              }}
              className={clsx('min-h-[24px] rounded-sm px-2.5 py-1 font-medium transition-colors', scope === k ? 'bg-raised text-text' : 'text-muted hover:text-text')}
            >
              {k === 'player' ? t('tl.mapScopePlayer') : t('tl.mapScopeAll')}
            </button>
          ))}
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded bg-sunken ring-1 ring-line">
          {mapImg && <img src={mapImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 saturate-50" onError={(e) => (e.currentTarget.style.display = 'none')} />}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="group" aria-label={t('tl.mapAria')}>
            {dots.map(({ e, role }, i) => {
              const [cx, cy] = pos(e.x, e.y);
              // "This player": green kills, red deaths. "Everyone": coloured by the killer's side.
              const color = scope === 'all' ? (sideOf(e.killer) === 200 ? 'var(--side-red)' : 'var(--side-blue)') : role === 'death' ? 'var(--loss)' : 'var(--win)';
              const active = sel && sel.t === e.t && sel.x === e.x && sel.y === e.y;
              const label = `${fmtTime(e.t)} · ${t('tl.xKilledY', { killer: name(e.killer), victim: name(e.victim) })}`;
              return (
                <g key={i} role="button" tabIndex={0} aria-label={label} onClick={() => pick(e.t, e.x, e.y)} onKeyDown={keys(e.t, e.x, e.y)} className="cursor-pointer outline-none [&:focus-visible>circle:last-child]:stroke-gold">
                  <circle cx={cx} cy={cy} r={4} fill="transparent" />
                  <circle cx={cx} cy={cy} r={scope === 'player' && role === 'assist' ? 1.8 : 2.3} fill={scope === 'player' && role === 'assist' ? 'none' : color} stroke={active ? 'var(--gold)' : scope === 'player' && role === 'assist' ? color : 'var(--bg)'} strokeWidth={active ? 0.9 : scope === 'player' && role === 'assist' ? 0.8 : 0.5} />
                </g>
              );
            })}
            {/* Epic monsters on top: there are few of them and they matter. */}
            {objectives.map((e, i) => {
              const p = objectivePos(e);
              if (!p) return null;
              // Several monsters die in the same pit: fan their markers out so each one can be clicked.
              const k = objectives.slice(0, i).filter((o) => String(objectivePos(o)) === String(p)).length;
              const [px, py] = pos(p[0], p[1]);
              const cx = px + ((k % 4) - 1.5) * 4.6;
              const cy = py + Math.floor(k / 4) * 4.6;
              const active = sel && sel.t === e.t && sel.x === p[0] && sel.y === p[1];
              return (
                <g key={`o${i}`} role="button" tabIndex={0} aria-label={`${fmtTime(e.t)} · ${objectiveLabel(e)}`} onClick={() => pick(e.t, p[0], p[1])} onKeyDown={keys(e.t, p[0], p[1])} className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-gold">
                  <rect x={cx - 2} y={cy - 2} width={4} height={4} transform={`rotate(45 ${cx} ${cy})`} fill={e.teamId === 100 ? 'var(--side-blue)' : 'var(--side-red)'} stroke={active ? 'var(--gold)' : 'var(--bg)'} strokeWidth={active ? 0.9 : 0.5} />
                </g>
              );
            })}
          </svg>
        </div>
        <figcaption className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
          {scope === 'player' ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-win" /> {t('tl.kill', { count: mine.filter((x) => x.role === 'kill').length })}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border border-win" /> {t('tl.assist', { count: mine.filter((x) => x.role === 'assist').length })}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-loss" /> {t('tl.death', { count: mine.filter((x) => x.role === 'death').length })}
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-side-blue" /> {t('live.blue')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-side-red" /> {t('live.red')}
              </span>
            </>
          )}
          <span className="flex items-center gap-1.5">
            <span className="size-2 rotate-45 bg-faint" /> {t('tl.mapObjectives')}
          </span>
        </figcaption>
        {/* What a click on the map found: everything within ~20 s and a short walk of that spot. */}
        <div aria-live="polite" className="mt-3">
          {sel ? (
            <div className="rounded border border-line bg-surface p-3 text-sm">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted">{t('tl.around', { time: fmtTime(sel.t) })}</span>
                <button onClick={() => setSel(null)} className="-my-1 min-h-[24px] px-1 text-xs text-faint hover:text-text">
                  {t('pc.close')}
                </button>
              </div>
              <ul className="space-y-1">
                {happenings.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="num w-10 shrink-0 text-xs text-faint">{fmtTime(h.e.t)}</span>
                    {h.kind === 'kill' ? (
                      <span>
                        <span className={clsx('font-medium', sideOf(h.e.killer) === 200 ? 'text-side-red' : 'text-side-blue')}>{name(h.e.killer)}</span>{' '}
                        {t('tl.killedWord')} <span className="font-medium">{name(h.e.victim)}</span>
                        {h.e.assists.length > 0 && <span className="text-muted"> · {t('tl.withAssists', { names: h.e.assists.map(name).join(', ') })}</span>}
                      </span>
                    ) : h.kind === 'objective' ? (
                      <span>
                        <span className={clsx('font-medium', h.e.teamId === 200 ? 'text-side-red' : 'text-side-blue')}>
                          {h.e.killer != null && h.e.killer >= 0 ? name(h.e.killer) : h.e.teamId === 200 ? t('live.red') : t('live.blue')}
                        </span>{' '}
                        {t('tl.tookWord')} <span className="font-medium">{objectiveLabel(h.e)}</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-gold">
                        {name(h.e.killer)}: {t(`multikill.${h.e.count as 2 | 3 | 4 | 5}`)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-faint">{t('tl.mapHint')}</p>
          )}
        </div>
      </figure>

      <ol className="max-h-[360px] space-y-0.5 overflow-y-auto pr-1 text-sm">
        {feed.length === 0 && <li className="text-muted">{t('tl.nothing')}</li>}
        {feed.map((f, i) => {
          const time = <span className="num w-11 shrink-0 text-xs text-faint">{fmtTime(f.t)}</span>;
          if (f.kind === 'objective') {
            const e = f.e as Extract<TimelineEvent, { type: 'objective' }>;
            const ours = e.teamId === myTeam;
            const Icon = e.monster === 'BARON_NASHOR' ? Crown : Castle;
            return (
              <li key={i} className="flex items-center gap-2 rounded px-2 py-1 text-muted">
                {time}
                <Icon className={clsx('size-4', e.teamId === 100 ? 'text-side-blue' : 'text-side-red')} aria-hidden />
                <span>
                  {t.rich(ours ? 'tl.ourTook' : 'tl.enemyTook', { objective: <span className="text-text">{objectiveLabel(e)}</span> })}
                </span>
              </li>
            );
          }
          const e = f.e as Extract<TimelineEvent, { type: 'kill' }>;
          const other = f.kind === 'death' ? champAt(e.killer) : champAt(e.victim);
          const Icon = f.kind === 'kill' ? Swords : f.kind === 'death' ? Skull : Handshake;
          return (
            <li key={i} className={clsx('flex items-center gap-2 rounded px-2 py-1', f.kind === 'death' ? 'bg-loss-tint' : f.kind === 'kill' ? 'bg-win-tint' : '')}>
              {time}
              <Icon className={clsx('size-4', f.kind === 'death' ? 'text-loss' : 'text-win')} aria-hidden />
              <GameImg src={other.url} alt="" size={20} rounded="sm" />
              <span>
                {t.rich(f.kind === 'kill' ? 'tl.killed' : f.kind === 'death' ? 'tl.killedBy' : 'tl.helped', { champion: <span className="font-medium">{other.name}</span> })}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
