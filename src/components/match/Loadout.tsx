import type { Participant } from '../../../shared/types';
import { assets, useStaticData } from '../../lib/ddragon';
import { GameImg } from '../ui/GameImg';

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

export function Items({ items, size = 22 }: { items: number[]; size?: number }) {
  const { data } = useStaticData();
  const a = assets(data);
  return (
    <div className="flex gap-0.5" aria-label="Items">
      {items.map((id, i) => {
        const it = a.item(id);
        return (
          <GameImg
            key={i}
            src={id ? it.url : undefined}
            alt={id ? it.name || `Item ${id}` : ''}
            size={size}
            rounded={i === 6 ? 'full' : 'sm'}
            className={i === 6 ? 'ml-0.5' : undefined}
            tip={id && it.name ? <Tip title={it.name} body={it.plaintext} extra={it.gold ? `${it.gold} gold` : undefined} /> : undefined}
          />
        );
      })}
    </div>
  );
}

export { Tip };
