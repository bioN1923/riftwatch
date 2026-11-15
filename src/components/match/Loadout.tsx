import type { Participant } from '../../../shared/types';
import { assets, useStaticData } from '../../lib/ddragon';
import { GameImg } from '../ui/GameImg';
import { ItemTip } from '../ui/ItemTip';
import { t } from '../../i18n';
import { useAugments } from '../../lib/augments';
import clsx from 'clsx';

type Assets = ReturnType<typeof assets>;

function Tip({ title, body, extra }: { title: string; body?: string; extra?: string }) {
  return (
    <>
      <span className="block font-semibold">{title}</span>
      {extra && <span className="block text-gold">{extra}</span>}
      {body && <span className="mt-0.5 block text-muted">{body}</span>}
    </>
  );
}

export function SpellsRunes({ p, a, size = 24 }: { p: Pick<Participant, 'spells' | 'keystone' | 'secondaryStyle'>; a: Assets; size?: number }) {
  const s1 = a.spell(p.spells[0]);
  const s2 = a.spell(p.spells[1]);
  const ks = a.rune(p.keystone);
  const sec = a.rune(p.secondaryStyle);
  return (
    <div className="flex gap-0.5">
      <div className="flex flex-col gap-0.5">
        <GameImg src={s1.url} alt={s1.name} size={size} rounded="sm" tip={s1.name ? <Tip title={s1.name} body={s1.description} /> : undefined} />
        <GameImg src={s2.url} alt={s2.name} size={size} rounded="sm" tip={s2.name ? <Tip title={s2.name} body={s2.description} /> : undefined} />
      </div>
      <div className="flex flex-col gap-0.5">
        <GameImg src={ks.url} alt={ks.name} size={size} rounded="full" className="bg-black/40" tip={ks.name ? <Tip title={ks.name} body={ks.desc} /> : undefined} />
        <span className="grid place-items-center" style={{ width: size, height: size }}>
          <GameImg src={sec.url} alt={sec.name} size={Math.round(size * 0.72)} rounded="full" tip={sec.name ? <Tip title={sec.name} /> : undefined} />
        </span>
      </div>
    </div>
  );
}

const RARITY: Record<number, { key: 'aug.silver' | 'aug.gold' | 'aug.prismatic'; ring: string }> = {
  0: { key: 'aug.silver', ring: 'ring-[#a7b4bd]/70' },
  1: { key: 'aug.gold', ring: 'ring-gold/80' },
  2: { key: 'aug.prismatic', ring: 'ring-[#c58cff]/80' },
};

/** The augments an Arena player picked, in pick order. Names only: no win rates (Riot's policy). */
export function Augments({ ids, size = 22 }: { ids: number[]; size?: number }) {
  const { data } = useAugments(ids.length > 0);
  const cols = ids.length > 4 ? 3 : 2;
  return (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, ${size}px)` }} role="group" aria-label={t('aug.label')}>
      {ids.map((id, i) => {
        const g = data?.get(id);
        const r = g ? RARITY[g.rarity] : undefined;
        const name = g?.name ?? t('aug.fallback', { id: String(id) });
        return (
          <GameImg
            key={i}
            src={g?.url}
            alt={name}
            size={size}
            rounded="sm"
            className={clsx('!bg-[#141c2b] ring-1', r?.ring ?? 'ring-line-strong')}
            tip={g ? <Tip title={g.name} extra={r ? t(r.key) : undefined} body={g.desc || undefined} /> : undefined}
          />
        );
      })}
    </div>
  );
}

/** Just the two summoner spells, stacked (Arena rows put augments where runes would go). */
export function SpellsOnly({ p, a, size = 24 }: { p: Pick<Participant, 'spells'>; a: Assets; size?: number }) {
  const s1 = a.spell(p.spells[0]);
  const s2 = a.spell(p.spells[1]);
  return (
    <div className="flex flex-col gap-0.5">
      <GameImg src={s1.url} alt={s1.name} size={size} rounded="sm" tip={s1.name ? <Tip title={s1.name} body={s1.description} /> : undefined} />
      <GameImg src={s2.url} alt={s2.name} size={size} rounded="sm" tip={s2.name ? <Tip title={s2.name} body={s2.description} /> : undefined} />
    </div>
  );
}

export function Items({ items, size = 22 }: { items: number[]; size?: number }) {
  const { data } = useStaticData();
  const a = assets(data);
  return (
    <div className="flex gap-0.5" role="group" aria-label={t('loadout.items')}>
      {items.map((id, i) => {
        const it = a.item(id);
        return (
          <GameImg
            key={i}
            src={id ? it.url : undefined}
            alt={id ? it.name || t('item.fallback', { id: String(id) }) : ''}
            size={size}
            rounded={i === 6 ? 'full' : 'sm'}
            className={i === 6 ? 'ml-0.5' : undefined}
            tip={id && it.name ? <ItemTip id={id} /> : undefined}
          />
        );
      })}
    </div>
  );
}

export { Tip };
