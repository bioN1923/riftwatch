import { useState } from 'react';
import clsx from 'clsx';
import { Skull, Swords, Handshake, Castle, Crown } from 'lucide-react';
import type { MatchSummary, MatchTimeline, TimelineEvent } from '../../../../shared/types';
import { assets, useStaticData } from '../../../lib/ddragon';
import { GameImg } from '../../ui/GameImg';
import { GoldChart, objectiveLabel } from '../../charts/GoldChart';
import { fmtTime, PlayerPicker, SectionTitle, TimelineGate, useTimeline } from './shared';

const MAP_SIZE = 14870;

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
                <SectionTitle aside="Hover the chart for the gold lead at each minute">Gold lead</SectionTitle>
                <GoldChart diff={diff} events={tl.events} />
              </section>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <h3 className="font-display text-lg font-bold">Kills, deaths and objectives</h3>
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
  const { data } = useStaticData();
  const a = assets(data);
  const me = tl.puuids.indexOf(who);
  const myTeam = match.participants.find((p) => p.puuid === who)?.teamId ?? 100;
  const champAt = (i: number) => {
    const p = match.participants.find((x) => x.puuid === tl.puuids[i]);
    return p ? a.champion(p.championId) : { url: undefined, name: 'Minions or turret' };
  };

  const kills = tl.events.filter((e): e is Extract<TimelineEvent, { type: 'kill' }> => e.type === 'kill');
  const mine = kills
    .map((e) => ({ e, role: e.killer === me ? 'kill' : e.victim === me ? 'death' : e.assists.includes(me) ? 'assist' : null }))
    .filter((x): x is { e: (typeof kills)[number]; role: 'kill' | 'death' | 'assist' } => x.role !== null);
  const feed = [
    ...mine.map(({ e, role }) => ({ t: e.t, kind: role, e })),
    ...tl.events.filter((e) => e.type === 'objective' && e.monster !== 'HORDE').map((e) => ({ t: e.t, kind: 'objective' as const, e })),
  ].sort((x, y) => x.t - y.t);

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,300px)_1fr]">
      <figure>
        <div className="relative aspect-square w-full overflow-hidden rounded bg-sunken ring-1 ring-line">
          {a.map && <img src={a.map} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 saturate-50" onError={(e) => (e.currentTarget.style.display = 'none')} />}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="img" aria-label="Where this player's kills and deaths happened">
            {mine.map(({ e, role }, i) => {
              const cx = (e.x / MAP_SIZE) * 100;
              const cy = 100 - (e.y / MAP_SIZE) * 100;
              const color = role === 'death' ? 'var(--loss)' : 'var(--win)';
              return (
                <circle key={i} cx={cx} cy={cy} r={role === 'assist' ? 1.8 : 2.3} fill={role === 'assist' ? 'none' : color} stroke={role === 'assist' ? color : 'var(--bg)'} strokeWidth={role === 'assist' ? 0.8 : 0.5}>
                  <title>
                    {fmtTime(e.t)} · {role === 'kill' ? `Killed ${champAt(e.victim).name}` : role === 'death' ? `Killed by ${champAt(e.killer).name}` : `Assisted on ${champAt(e.victim).name}`}
                  </title>
                </circle>
              );
            })}
          </svg>
        </div>
        <figcaption className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-win" /> Kill ({mine.filter((x) => x.role === 'kill').length})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-win" /> Assist ({mine.filter((x) => x.role === 'assist').length})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-loss" /> Death ({mine.filter((x) => x.role === 'death').length})
          </span>
        </figcaption>
      </figure>

      <ol className="max-h-[360px] space-y-0.5 overflow-y-auto pr-1 text-sm">
        {feed.length === 0 && <li className="text-muted">Nothing happened for this player.</li>}
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
                  {ours ? 'Your team' : 'Enemy team'} took <span className="text-text">{objectiveLabel(e)}</span>
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
                {f.kind === 'kill' ? 'Killed' : f.kind === 'death' ? 'Killed by' : 'Helped kill'} <span className="font-medium">{other.name}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
