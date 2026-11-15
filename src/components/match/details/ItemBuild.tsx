import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import type { MatchSummary, MatchTimeline, Participant } from '../../../../shared/types';
import { assets, champSlug, useStaticData } from '../../../lib/ddragon';
import { api } from '../../../lib/api';
import { compareCore, isLegendary, purchasedCore } from '../../../lib/buildCompare';
import { pct, winRateTone } from '../../../lib/format';
import { isArenaMatch } from '../../../../shared/queues';
import { ROLE_LABEL } from '../../ui/RoleIcon';
import { MaxOrder, maxOrderOf, RuneTrees, SkillGrid } from '../../build/BuildParts';
import { GameImg } from '../../ui/GameImg';
import { ItemTip } from '../../ui/ItemTip';
import { fmtTime, PlayerPicker, SectionTitle, TimelineGate, useTimeline } from './shared';
import { t } from '../../../i18n';

export function ItemBuild({ match, puuid, platform }: { match: MatchSummary; puuid: string; platform: string }) {
  const q = useTimeline(platform, match.id);
  const [who, setWho] = useState(puuid);
  const p = match.participants.find((x) => x.puuid === who)!;
  return (
    <div className="space-y-6 p-4">
      <PlayerPicker match={match} value={who} onChange={setWho} />
      <TimelineGate q={q}>
        {() => {
          const i = q.data!.puuids.indexOf(who);
          return (
            <>
              <PurchasePath items={q.data!.items[i] ?? []} />
              <SkillOrder skills={q.data!.skills[i] ?? []} />
              {p.position && match.queueId !== 450 && !isArenaMatch(match) && <VsHighElo p={p} purchases={q.data!.items[i] ?? []} skills={q.data!.skills[i] ?? []} />}
            </>
          );
        }}
      </TimelineGate>
      <RunePage p={p} />
    </div>
  );
}

function PurchasePath({ items }: { items: MatchTimeline['items'][number] }) {
  const { data } = useStaticData();
  const a = assets(data);
  if (!items.length) return <p className="text-sm text-muted">{t('ib.none')}</p>;

  // Group purchases made within the same shop visit (less than 45 seconds apart).
  const groups: { t: number; list: typeof items }[] = [];
  for (const it of items) {
    const last = groups[groups.length - 1];
    if (last && it.t - last.list[last.list.length - 1].t < 45) last.list.push(it);
    else groups.push({ t: it.t, list: [it] });
  }

  return (
    <section>
      <SectionTitle aside={t('ib.visits', { count: groups.length })}>{t('ib.path')}</SectionTitle>
      <ol className="flex flex-wrap items-center gap-y-3">
        {groups.map((g, gi) => (
          <li key={gi} className="flex items-center">
            <div className="flex flex-col items-center gap-1 rounded border border-line bg-surface px-1.5 pb-1 pt-1.5">
              <div className="flex gap-0.5">
                {g.list.map((it, k) => {
                  const info = a.item(it.itemId);
                  return (
                    <span key={k} className={clsx('relative', it.sold && 'opacity-45')}>
                      <GameImg
                        src={info.url}
                        alt={it.sold ? t('ib.soldItem', { item: info.name || String(it.itemId) }) : info.name || t('item.fallback', { id: String(it.itemId) })}
                        size={30}
                        rounded="sm"
                        tip={<ItemTip id={it.itemId} note={it.sold ? t('ib.sold') : undefined} />}
                      />
                      {it.sold && <span className="absolute inset-x-0 top-1/2 h-[2px] -rotate-45 bg-loss" aria-hidden />}
                    </span>
                  );
                })}
              </div>
              <span className="num text-[11px] text-muted">{fmtTime(g.t)}</span>
            </div>
            {gi < groups.length - 1 && <ChevronRight className="mx-0.5 size-4 shrink-0 text-faint" aria-hidden />}
          </li>
        ))}
      </ol>
    </section>
  );
}

function SkillOrder({ skills }: { skills: number[] }) {
  if (!skills.length) return null;
  return (
    <section>
      <SectionTitle
        aside={
          <span className="flex items-center gap-2 text-sm">
            {t('ib.maxOrder')} <MaxOrder order={maxOrderOf(skills)} />
          </span>
        }
      >
        {t('ib.skillOrder')}
      </SectionTitle>
      <SkillGrid skills={skills} />
    </section>
  );
}

function RunePage({ p }: { p: Participant }) {
  if (!p.runes.primary.length) return null;
  return (
    <section>
      <SectionTitle>{t('ib.runes')}</SectionTitle>
      <RuneTrees primaryStyle={p.primaryStyle} secondaryStyle={p.secondaryStyle} picked={[...p.runes.primary, ...p.runes.secondary]} shards={p.runes.shards} />
    </section>
  );
}

/** This game's core items and skill max order next to what high-elo players do on the same champion and role. */
function VsHighElo({ p, purchases, skills }: { p: Participant; purchases: MatchTimeline['items'][number]; skills: number[] }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  const q = useQuery({
    queryKey: ['champion', p.championId, 'ranked', p.position, undefined],
    queryFn: ({ signal }) => api.champion(p.championId, { group: 'ranked', role: p.position }, signal),
    staleTime: 60_000,
  });
  const s = q.data;
  if (!s || !sd || s.role !== p.position || !s.core.length) return null;
  const core = purchasedCore(p.items, purchases, (id) => isLegendary(id, sd.items));
  const verdict = compareCore(core, s.core);
  if (!verdict) return null;
  const top = s.core[0];
  const mine = maxOrderOf(skills);
  const theirs = s.skills.maxOrders[0];
  const mineKey = mine.map((k) => 'QWE'[k - 1]).join('');
  const slug = sd.champions.get(p.championId)?.id;
  const champ = a.champion(p.championId).name;
  const icons = (ids: number[], hl?: number[]) => (
    <span className="flex gap-0.5">
      {ids.map((id, k) => (
        <span key={k} className={clsx('rounded-sm', hl && (hl.includes(id) ? 'ring-2 ring-gold' : 'opacity-60'))}>
          <GameImg src={a.item(id).url} alt={a.item(id).name || String(id)} size={26} rounded="sm" tip={<ItemTip id={id} />} />
        </span>
      ))}
    </span>
  );
  const rate = (wr: number, games: number) => (
    <span className="num text-xs text-muted">
      <span className={clsx('font-semibold', winRateTone(wr, games))}>{pct(wr, 1)}</span> · {t('common.games', { count: games })}
    </span>
  );
  return (
    <section aria-labelledby="vs-he-h">
      <SectionTitle
        aside={
          slug && (
            <Link to={`/champions/${champSlug(slug)}?role=${p.position}`} className="font-medium text-gold hover:underline">
              {t('ib.vsFull')}
            </Link>
          )
        }
      >
        <span id="vs-he-h">{t('ib.vsTitle', { champion: champ, role: ROLE_LABEL[p.position] })}</span>
      </SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="panel space-y-2 p-3 text-sm">
          <p className="font-semibold">{t('ib.vsCore')}</p>
          {verdict.kind === 'same' ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {icons(core)}
                {rate(verdict.build.winRate, verdict.build.games)}
              </div>
              <p className="text-muted">{verdict.rank === 1 ? t('ib.vsSameTop') : t('ib.vsSame', { rank: verdict.rank })}</p>
            </>
          ) : (
            <>
              {core.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-20 shrink-0 text-xs text-muted">{t('ib.vsThisGame')}</span>
                  {icons(core, verdict.kind === 'differs' ? verdict.shared : undefined)}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-20 shrink-0 text-xs text-muted">{t('ib.vsMostPlayed')}</span>
                {icons(top.ids)}
                {rate(top.winRate, top.games)}
              </div>
              <p className="text-muted">
                {verdict.kind === 'short' ? t('ib.vsShort', { count: verdict.have }) : t('ib.vsShared', { n: verdict.shared.length })}
              </p>
            </>
          )}
        </div>
        {theirs && skills.length >= 9 && (
          <div className="panel space-y-2 p-3 text-sm">
            <p className="font-semibold">{t('ib.vsMax')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-muted">{t('ib.vsThisGame')}</span>
              <MaxOrder order={mine} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-muted">{t('ib.vsMostPlayed')}</span>
              <MaxOrder order={theirs.order.split('').map((k) => 'QWE'.indexOf(k) + 1)} />
              {rate(theirs.winRate, theirs.games)}
            </div>
            <p className="text-muted">{mineKey === theirs.order ? t('ib.vsMaxSame') : t('ib.vsMaxDiff')}</p>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-faint">{t('ib.vsNote', { patch: s.patch ?? '' })}</p>
    </section>
  );
}
