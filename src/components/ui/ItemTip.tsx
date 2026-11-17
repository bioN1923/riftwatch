import { useMemo } from 'react';
import clsx from 'clsx';
import { assets, useStaticData } from '../../lib/ddragon';
import { parseItem, type Seg, type Tone } from '../../lib/itemText';
import { num, t } from '../../i18n';

const TONE: Record<Tone, string> = {
  phys: 'text-[var(--tone-phys)]',
  magic: 'text-[var(--tone-magic)]',
  true: 'font-semibold text-text',
  heal: 'text-[var(--tone-heal)]',
  shield: 'text-[var(--tone-shield)]',
  speed: 'text-[var(--tone-speed)]',
  key: 'font-medium text-text',
  muted: 'text-faint',
};

function Text({ segs }: { segs: Seg[] }) {
  return (
    <span className="whitespace-pre-line">
      {segs.map((s, i) => (
        <span key={i} className={s.tone ? TONE[s.tone] : undefined}>
          {s.text}
        </span>
      ))}
    </span>
  );
}

/** Rich item tooltip: name and cost, stat lines, passives/actives with damage colours, and what it builds from. */
export function ItemTip({ id, note }: { id: number; note?: string }) {
  const { data } = useStaticData();
  const a = assets(data);
  const it = data?.items.get(id);
  const parsed = useMemo(() => (it ? parseItem(it.description) : null), [it]);
  if (!it || !parsed) return <span className="font-semibold">{t('item.fallback', { id: String(id) })}</span>;

  return (
    <span className="block w-[17rem] max-w-full">
      <span className="flex items-start gap-2.5">
        <img src={a.item(id).url} alt="" className="size-9 shrink-0 rounded-[4px] ring-1 ring-line-strong" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-bold leading-tight text-text">{it.name}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
            {/* Support upgrades aren't bought (their 400 is a sell-back value): say where they come from instead of a price. */}
            {it.upgradeOf != null ? (
              <span className="font-medium text-muted">{t('it.upgradeFrom', { name: data?.items.get(it.upgradeOf)?.name ?? '' })}</span>
            ) : it.gold > 0 && (
              <span className="num inline-flex items-center gap-1 font-semibold text-gold">
                <span className="size-2 rounded-full bg-gold" aria-hidden />
                {num(it.gold)}
              </span>
            )}
            {note && <span className="rounded-sm bg-sunken px-1.5 py-px font-medium text-muted">{note}</span>}
          </span>
        </span>
      </span>

      {parsed.stats.length > 0 && (
        <span className="mt-2.5 block space-y-0.5 border-t border-line pt-2">
          {parsed.stats.map((s, i) => (
            <span key={i} className="flex items-baseline gap-2">
              <span className="num min-w-9 text-right font-semibold text-text">{s.value}</span>
              <span className="text-muted">{s.name}</span>
            </span>
          ))}
        </span>
      )}

      {parsed.effects.length > 0 && (
        <span className="mt-2.5 block space-y-2 border-t border-line pt-2">
          {parsed.effects.map((e, i) => (
            <span key={i} className="block leading-snug text-muted">
              {e.kind !== 'text' && (
                <span className="mb-0.5 flex items-center gap-1.5">
                  <span
                    className={clsx(
                      'rounded-sm px-1 py-px text-[9px] font-bold uppercase tracking-wider',
                      e.kind === 'active' ? 'bg-gold text-gold-ink' : 'bg-sunken text-faint ring-1 ring-line',
                    )}
                  >
                    {e.kind === 'active' ? t('item.active') : t('item.passive')}
                  </span>
                  {e.name && ![e.kind, (e.kind === 'active' ? t('item.active') : t('item.passive')).toLowerCase()].includes(e.name.toLowerCase()) && <span className="font-semibold text-gold">{e.name}</span>}
                </span>
              )}
              <Text segs={e.segs} />
            </span>
          ))}
        </span>
      )}

      {!parsed.stats.length && !parsed.effects.length && it.plaintext && <span className="mt-2 block text-muted">{it.plaintext}</span>}

      {it.from.length > 0 && (
        <span className="mt-2.5 flex items-center gap-1.5 border-t border-line pt-2 text-[11px] text-faint">
          {t('item.buildsFrom')}
          {it.from.map((f, i) => (
            <img key={i} src={a.item(f).url} alt={data?.items.get(f)?.name ?? ''} className="size-5 rounded-[3px] ring-1 ring-line" />
          ))}
        </span>
      )}
    </span>
  );
}
