import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Skull, Swords, Handshake, Castle, Crown, X } from 'lucide-react';
import type { MatchSummary, MatchTimeline, TimelineEvent } from '../../../../shared/types';
import { assets, useStaticData } from '../../../lib/ddragon';
import { GameImg } from '../../ui/GameImg';
import { GoldChart, objectiveLabel } from '../../charts/GoldChart';
import { fmtTime, PlayerPicker, SectionTitle, TimelineGate, useTimeline } from './shared';
import { t } from '../../../i18n';
import { happeningsNear, MAP_SIZE, objectivePos } from '../../../lib/mapEvents';
import { RANDOM_CHAMP_QUEUES } from '../../../lib/liveTags';
import { turningPoints, type TurningPoint } from '../../../lib/turningPoints';
import { decimal } from '../../../lib/format';

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
              <TurningPoints match={match} tl={tl} diff={diff} side={side} />
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
  // The picked moment: game time and map position, plus where on the map (in %) its popup points.
  const [sel, setSel] = useState<{
    t: number;
    x: number;
    y: number;
    ax: number;
    ay: number;
  } | null>(null);
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
    .map((e) => ({
      e,
      role: e.killer === me ? 'kill' : e.victim === me ? 'death' : e.assists.includes(me) ? 'assist' : null,
    }))
    .filter(
      (
        x,
      ): x is {
        e: (typeof kills)[number];
        role: 'kill' | 'death' | 'assist';
      } => x.role !== null,
    );
  const feed = [
    ...mine.map(({ e, role }) => ({ t: e.t, kind: role, e })),
    ...tl.events.filter((e) => e.type === 'objective' && e.monster !== 'HORDE').map((e) => ({ t: e.t, kind: 'objective' as const, e })),
  ].sort((x, y) => x.t - y.t);

  const name = (i: number) => (i >= 0 ? champAt(i).name : t('tl.minions'));
  const sideOf = (i: number) => (i >= 0 ? (match.participants.find((x) => x.puuid === tl.puuids[i])?.teamId ?? 100) : 0);
  const allKills = kills.map((e) => ({
    e,
    role: (e.killer === me ? 'kill' : e.victim === me ? 'death' : e.assists.includes(me) ? 'assist' : 'other') as 'kill' | 'death' | 'assist' | 'other',
  }));
  const dots = scope === 'player' ? mine : allKills;
  const objectives = tl.events.filter((e): e is Extract<TimelineEvent, { type: 'objective' }> => e.type === 'objective');
  const happenings = sel ? happeningsNear(tl.events, sel) : [];
  // Rows of the event list that the selected map spot covers, so map and list point at the same moment.
  const hit = new Set<TimelineEvent>(happenings.filter((h) => h.kind !== 'multi').map((h) => h.e as TimelineEvent));
  const listRef = useRef<HTMLOListElement>(null);
  const mapRef = useRef<HTMLElement>(null);
  // From the list: on phones the map sits above the list, so bring it back into view to show the answer.
  const pickFromList = (t0: number, x: number, y: number) => {
    pick(t0, x, y);
    // Only when the map square isn't fully on screen (64 px: the sticky header).
    const sq = mapRef.current?.querySelector('svg')?.getBoundingClientRect();
    if (sq && (sq.top < 64 || sq.bottom > window.innerHeight)) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      mapRef.current!.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };
  useEffect(() => {
    // Scroll only the list (not the page) so the first matching row is in view.
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>('[data-hit]');
    if (list && row && (row.offsetTop < list.scrollTop || row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight)) {
      list.scrollTo({
        top: Math.max(0, row.offsetTop - 8),
        behavior: 'smooth',
      });
    }
  }, [sel]);
  // ARAM is played on the Howling Abyss (map 12, about 12,900 units across), everything else here on the Rift.
  const aram = RANDOM_CHAMP_QUEUES.has(match.queueId);
  const size = aram ? 12900 : MAP_SIZE;
  const mapImg = a.map && aram ? a.map.replace('map11.png', 'map12.png') : a.map;
  const pos = (x: number, y: number) => [(x / size) * 100, 100 - (y / size) * 100] as const;
  const pick = (t0: number, x: number, y: number, at?: readonly [number, number]) => {
    const [ax, ay] = at ?? pos(x, y);
    setSel((s) => (s && s.t === t0 && s.x === x && s.y === y ? null : { t: t0, x, y, ax, ay }));
  };
  const keys = (t0: number, x: number, y: number, at?: readonly [number, number]) => (ev: React.KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      pick(t0, x, y, at);
    }
  };
  useEffect(() => {
    if (!sel) return;
    const esc = (ev: KeyboardEvent) => ev.key === 'Escape' && setSel(null);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [sel]);

  // What a click on the map found: everything within ~20 s and a short walk of that spot.
  const happeningsList = (
    <ul className="space-y-1">
      {happenings.map((h, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="num w-10 shrink-0 text-xs text-faint">{fmtTime(h.e.t)}</span>
          {h.kind === 'kill' ? (
            <span>
              <span className={clsx('font-medium', sideOf(h.e.killer) === 200 ? 'text-side-red' : 'text-side-blue')}>{name(h.e.killer)}</span> {t('tl.killedWord')}{' '}
              <span className="font-medium">{name(h.e.victim)}</span>
              {h.e.assists.length > 0 && (
                <span className="text-muted">
                  {' '}
                  ·{' '}
                  {t('tl.withAssists', {
                    names: h.e.assists.map(name).join(', '),
                  })}
                </span>
              )}
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
  );

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,300px)_1fr]">
      <figure ref={mapRef} className="scroll-mt-[88px]">
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
        <div className="relative">
          <div className="relative aspect-square w-full overflow-hidden rounded bg-sunken ring-1 ring-line">
            {mapImg && <img src={mapImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 saturate-50" onError={(e) => (e.currentTarget.style.display = 'none')} />}
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="group" aria-label={t('tl.mapAria')}>
              {/* Clicking empty map closes the popup. */}
              <rect x={0} y={0} width={100} height={100} fill="transparent" onClick={() => setSel(null)} />
              {dots.map(({ e, role }, i) => {
                const [cx, cy] = pos(e.x, e.y);
                // "This player": green kills, red deaths. "Everyone": coloured by the killer's side.
                const color = scope === 'all' ? (sideOf(e.killer) === 200 ? 'var(--side-red)' : 'var(--side-blue)') : role === 'death' ? 'var(--loss)' : 'var(--win)';
                const active = sel && sel.t === e.t && sel.x === e.x && sel.y === e.y;
                const label = `${fmtTime(e.t)} · ${t('tl.xKilledY', { killer: name(e.killer), victim: name(e.victim) })}`;
                return (
                  <g
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-label={label}
                    onClick={() => pick(e.t, e.x, e.y)}
                    onKeyDown={keys(e.t, e.x, e.y)}
                    className="cursor-pointer outline-none [&:focus-visible>circle:last-child]:stroke-gold"
                  >
                    <circle cx={cx} cy={cy} r={4} fill="transparent" />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={scope === 'player' && role === 'assist' ? 1.8 : 2.3}
                      fill={scope === 'player' && role === 'assist' ? 'none' : color}
                      stroke={active ? 'var(--gold)' : scope === 'player' && role === 'assist' ? color : 'var(--bg)'}
                      strokeWidth={active ? 0.9 : scope === 'player' && role === 'assist' ? 0.8 : 0.5}
                    />
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
                  <g
                    key={`o${i}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${fmtTime(e.t)} · ${objectiveLabel(e)}`}
                    onClick={() => pick(e.t, p[0], p[1], [cx, cy])}
                    onKeyDown={keys(e.t, p[0], p[1], [cx, cy])}
                    className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-gold"
                  >
                    <rect
                      x={cx - 2}
                      y={cy - 2}
                      width={4}
                      height={4}
                      transform={`rotate(45 ${cx} ${cy})`}
                      fill={e.teamId === 100 ? 'var(--side-blue)' : 'var(--side-red)'}
                      stroke={active ? 'var(--gold)' : 'var(--bg)'}
                      strokeWidth={active ? 0.9 : 0.5}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
          {sel && (
            <MapPopup sel={sel} onClose={() => setSel(null)}>
              {happeningsList}
            </MapPopup>
          )}
        </div>
        <figcaption className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
          {scope === 'player' ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-win" />{' '}
                {t('tl.kill', {
                  count: mine.filter((x) => x.role === 'kill').length,
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border border-win" />{' '}
                {t('tl.assist', {
                  count: mine.filter((x) => x.role === 'assist').length,
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-loss" />{' '}
                {t('tl.death', {
                  count: mine.filter((x) => x.role === 'death').length,
                })}
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
        {!sel && <p className="mt-3 text-xs text-faint">{t('tl.mapHint')}</p>}
      </figure>

      <ol ref={listRef} aria-label={t('tl.listAria')} className="relative max-h-[360px] space-y-0.5 overflow-y-auto pr-1 text-sm">
        {feed.length === 0 && <li className="text-muted">{t('tl.nothing')}</li>}
        {feed.map((f, i) => {
          const time = <span className="num w-11 shrink-0 text-xs text-faint">{fmtTime(f.t)}</span>;
          if (f.kind === 'objective') {
            const e = f.e as Extract<TimelineEvent, { type: 'objective' }>;
            const ours = e.teamId === myTeam;
            const Icon = e.monster === 'BARON_NASHOR' ? Crown : Castle;
            const p = objectivePos(e);
            return (
              <li key={i} data-hit={hit.has(e) || undefined}>
                <Row on={hit.has(e)} pick={p ? () => pickFromList(e.t, p[0], p[1]) : undefined} className="text-muted">
                  {time}
                  <Icon className={clsx('size-4', e.teamId === 100 ? 'text-side-blue' : 'text-side-red')} aria-hidden />
                  <span>
                    {t.rich(ours ? 'tl.ourTook' : 'tl.enemyTook', {
                      objective: <span className="text-text">{objectiveLabel(e)}</span>,
                    })}
                  </span>
                </Row>
              </li>
            );
          }
          const e = f.e as Extract<TimelineEvent, { type: 'kill' }>;
          const other = f.kind === 'death' ? champAt(e.killer) : champAt(e.victim);
          const Icon = f.kind === 'kill' ? Swords : f.kind === 'death' ? Skull : Handshake;
          return (
            <li key={i} data-hit={hit.has(e) || undefined}>
              <Row on={hit.has(e)} pick={() => pickFromList(e.t, e.x, e.y)} className={f.kind === 'death' ? 'bg-loss-tint' : f.kind === 'kill' ? 'bg-win-tint' : ''}>
                {time}
                <Icon className={clsx('size-4', f.kind === 'death' ? 'text-loss' : 'text-win')} aria-hidden />
                <GameImg src={other.url} alt="" size={20} rounded="sm" />
                <span>
                  {t.rich(f.kind === 'kill' ? 'tl.killed' : f.kind === 'death' ? 'tl.killedBy' : 'tl.helped', {
                    champion: <span className="font-medium">{other.name}</span>,
                  })}
                </span>
              </Row>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** One event-list row: a button that shows the spot on the map, outlined while the map spot covers it. */
function Row({ on, pick, className, children }: { on: boolean; pick?: () => void; className: string; children: React.ReactNode }) {
  const cls = clsx('flex w-full items-center gap-2 rounded px-2 py-1 text-left', className, on && 'ring-1 ring-gold/70');
  if (!pick) return <div className={cls}>{children}</div>;
  return (
    <button
      type="button"
      onClick={pick}
      aria-pressed={on}
      title={t('tl.showOnMap')}
      className={clsx(cls, 'transition-colors hover:ring-1 hover:ring-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60')}
    >
      {children}
    </button>
  );
}

/** The few moments that decided the game, in plain sentences (see lib/turningPoints). */
function TurningPoints({ match, tl, diff, side }: { match: MatchSummary; tl: MatchTimeline; diff: number[]; side: number[] }) {
  const { data } = useStaticData();
  const a = assets(data);
  const winner = match.participants.find((p) => p.win)?.teamId;
  if (!winner || diff.length < 6) return null; // remakes and very short games have no story to tell
  // In game order, so they read as the story of the match.
  const at = (p: TurningPoint) => (p.kind === 'firstBlood' || p.kind === 'fight' ? p.t : p.kind === 'swing' ? p.from * 60 : p.minute * 60);
  const points = turningPoints(tl.events, diff, side, winner).sort((x, y) => at(x) - at(y));
  if (!points.length) return null;
  const champ = (i: number) => {
    const p = match.participants.find((x) => x.puuid === tl.puuids[i]);
    const team = side[i] ?? 0;
    return <span className={clsx('font-medium', team === 200 ? 'text-side-red' : 'text-side-blue')}>{p ? a.champion(p.championId).name : t('tl.minions')}</span>;
  };
  const team = (id: number) => <span className={clsx('font-medium', id === 200 ? 'text-side-red' : 'text-side-blue')}>{id === 200 ? t('live.red') : t('live.blue')}</span>;
  const gold = (g: number) => `${decimal(g / 1000, 1)}k`;
  const row = (p: TurningPoint): [string, React.ReactNode] => {
    switch (p.kind) {
      case 'firstBlood':
        return [
          fmtTime(p.t),
          t.rich('tp.firstBlood', {
            killer: champ(p.killer),
            victim: champ(p.victim),
          }),
        ];
      case 'swing':
        return [
          `${p.from}–${p.to} min`,
          t.rich('tp.swing', {
            team: team(p.team),
            gold: gold(p.gold),
            minutes: p.to - p.from,
          }),
        ];
      case 'fight': {
        const took = [...p.objectives.map((o) => objectiveLabel(o)), ...(p.towers ? [t('tp.towers', { count: p.towers })] : [])];
        return [
          fmtTime(p.t),
          <>
            {t.rich('tp.fight', {
              team: team(p.team),
              won: p.won,
              lost: p.lost,
            })}
            {took.length > 0 && <> {t('tp.took', { things: took.join(', ') })}</>}
          </>,
        ];
      }
      case 'comeback':
        return [`${p.minute} min`, t.rich('tp.comeback', { team: team(p.team), gold: gold(p.gold) })];
      case 'led':
        return [`${p.minute} min`, t.rich('tp.led', { team: team(p.team) })];
    }
  };
  return (
    <section aria-labelledby="tp-h">
      <h3 id="tp-h" className="mb-2 font-display text-lg font-bold">
        {t('tp.title')}
      </h3>
      <ol className="max-w-3xl space-y-1.5 text-sm">
        {points.map((p) => {
          const [when, what] = row(p);
          return (
            <li key={p.kind} className="flex items-baseline gap-3">
              <span className="num w-16 shrink-0 text-xs text-faint">{when}</span>
              <span className="text-muted">{what}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * The events at a picked spot, in a small box pinned to that spot on the map. It opens above the
 * spot in the lower half of the map and below it in the upper half, and leans inwards near the edges.
 */
function MapPopup({ sel, onClose, children }: { sel: { t: number; ax: number; ay: number }; onClose: () => void; children: React.ReactNode }) {
  const below = sel.ay < 45;
  const shift = sel.ax < 30 ? '-12%' : sel.ax > 70 ? '-88%' : '-50%';
  return (
    <div
      role="dialog"
      aria-label={t('tl.around', { time: fmtTime(sel.t) })}
      aria-live="polite"
      className="absolute z-20 w-[min(280px,85vw)] rounded border border-line-strong bg-surface p-3 text-sm shadow-xl shadow-black/40"
      style={{
        left: `${sel.ax}%`,
        transform: `translateX(${shift})`,
        ...(below ? { top: `calc(${sel.ay}% + 10px)` } : { bottom: `calc(${100 - sel.ay}% + 10px)` }),
      }}
    >
      {/* A small pointer from the box to the spot. */}
      <span
        aria-hidden
        className={clsx('absolute size-2.5 -translate-x-1/2 rotate-45 border-line-strong bg-surface', below ? '-top-[6px] border-l border-t' : '-bottom-[6px] border-b border-r')}
        style={{ left: shift.slice(1) }}
      />
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{t('tl.around', { time: fmtTime(sel.t) })}</span>
        <button type="button" onClick={onClose} aria-label={t('pc.close')} className="-my-1 -mr-1 grid size-[24px] place-items-center rounded text-faint hover:bg-raised hover:text-text">
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      {children}
    </div>
  );
}
