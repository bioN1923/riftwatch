import { useState } from 'react';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import type { MatchSummary, MatchTimeline, Participant } from '../../../../shared/types';
import { assets, useStaticData } from '../../../lib/ddragon';
import { MaxOrder, maxOrderOf, RuneTrees, SkillGrid } from '../../build/BuildParts';
import { GameImg } from '../../ui/GameImg';
import { Tip } from '../Loadout';
import { fmtTime, PlayerPicker, SectionTitle, TimelineGate, useTimeline } from './shared';

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
  if (!items.length) return <p className="text-sm text-muted">No purchases recorded.</p>;

  // Group purchases made within the same shop visit (less than 45 seconds apart).
  const groups: { t: number; list: typeof items }[] = [];
  for (const it of items) {
    const last = groups[groups.length - 1];
    if (last && it.t - last.list[last.list.length - 1].t < 45) last.list.push(it);
    else groups.push({ t: it.t, list: [it] });
  }

  return (
    <section>
      <SectionTitle aside={`${groups.length} shop visits`}>Item path</SectionTitle>
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
                        alt={`${it.sold ? 'Sold ' : ''}${info.name || `item ${it.itemId}`}`}
                        size={30}
                        rounded="sm"
                        tip={<Tip title={info.name || `Item ${it.itemId}`} body={info.plaintext} extra={it.sold ? 'Sold' : info.gold ? `${info.gold} gold` : undefined} />}
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
            Max order <MaxOrder order={maxOrderOf(skills)} />
          </span>
        }
      >
        Skill order
      </SectionTitle>
      <SkillGrid skills={skills} />
    </section>
  );
}

function RunePage({ p }: { p: Participant }) {
  if (!p.runes.primary.length) return null;
  return (
    <section>
      <SectionTitle>Runes</SectionTitle>
      <RuneTrees primaryStyle={p.primaryStyle} secondaryStyle={p.secondaryStyle} picked={[...p.runes.primary, ...p.runes.secondary]} shards={p.runes.shards} />
    </section>
  );
}
