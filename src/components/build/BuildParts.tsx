import { Link } from 'react-router';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import { assets, SHARD_INFO, SHARD_ROWS, shardIcon, useStaticData, type StaticData } from '../../lib/ddragon';
import { GameImg } from '../ui/GameImg';
import { Tip } from '../match/Loadout';
import { ItemTip } from '../ui/ItemTip';
import { t } from '../../i18n';

const KEYS = ['Q', 'W', 'E', 'R'];

/** Which basic ability was maxed first, second, third. */
export function maxOrderOf(skills: number[]) {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  const maxedAt: Record<number, number> = {};
  skills.forEach((s, i) => {
    if (s <= 3 && ++counts[s] === 5) maxedAt[s] = i;
  });
  return [1, 2, 3].sort((x, y) => (maxedAt[x] ?? 99 + (5 - counts[x])) - (maxedAt[y] ?? 99 + (5 - counts[y])));
}

export function MaxOrder({ order, icons }: { order: number[]; icons?: (string | undefined)[] }) {
  return (
    <span className="flex items-center gap-1">
      {order.map((s, i) => (
        <span key={s} className="flex items-center gap-1">
          <span className="relative">
            {icons?.[s - 1] ? (
              <GameImg src={icons[s - 1]} alt={KEYS[s - 1]} size={26} rounded="sm" />
            ) : (
              <kbd className="grid size-6 place-items-center rounded-sm bg-gold font-display text-sm font-bold text-gold-ink">{KEYS[s - 1]}</kbd>
            )}
            {icons?.[s - 1] && <span className="absolute -bottom-1 -right-1 rounded-sm bg-bg px-0.5 font-display text-[10px] font-bold leading-tight text-gold">{KEYS[s - 1]}</span>}
          </span>
          {i < order.length - 1 && <ChevronRight className="size-3.5 text-faint" aria-hidden />}
        </span>
      ))}
    </span>
  );
}

/** 4 × 18 grid: which ability was levelled at each champion level. */
export function SkillGrid({ skills, icons }: { skills: number[]; icons?: (string | undefined)[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-[3px] text-xs">
        <caption className="sr-only">{t('bp.skillCaption')}</caption>
        <tbody>
          {[1, 2, 3, 4].map((slot) => (
            <tr key={slot}>
              <th scope="row" className="pr-1.5 text-left">
                {icons?.[slot - 1] ? (
                  <GameImg src={icons[slot - 1]} alt={KEYS[slot - 1]} size={24} rounded="sm" />
                ) : (
                  <span className="font-display text-base font-bold text-muted">{KEYS[slot - 1]}</span>
                )}
              </th>
              {Array.from({ length: 18 }, (_, lvl) => {
                const on = skills[lvl] === slot;
                return (
                  <td
                    key={lvl}
                    style={on ? { animationDelay: `${lvl * 25}ms` } : undefined}
                    className={clsx(
                      'num size-6 rounded-sm text-center font-semibold',
                      on ? clsx('pop-in', slot === 4 ? 'bg-gold text-gold-ink' : 'bg-series-2 text-on-accent') : lvl < skills.length ? 'bg-sunken' : 'bg-sunken/40',
                    )}
                  >
                    {on ? lvl + 1 : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Full rune page the way the client shows it: every option, picked ones lit. */
export function RuneTrees({ primaryStyle, secondaryStyle, picked, shards }: { primaryStyle: number; secondaryStyle: number; picked: number[]; shards: number[] }) {
  const { data } = useStaticData();
  const a = assets(data);
  if (!data) return null;
  const primary = data.trees.find((t) => t.id === primaryStyle);
  const secondary = data.trees.find((t) => t.id === secondaryStyle);
  const set = new Set(picked);
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-5">
      {primary && <Tree tree={primary} picked={set} a={a} withKeystone />}
      {secondary && <Tree tree={secondary} picked={set} a={a} />}
      {shards.length > 0 && <ShardGrid shards={shards} />}
      {/* The chosen runes by name, so the page reads without hovering every icon. Fills the room beside the trees from
          md up; hidden from screen readers, which already get each lit icon's name. */}
      <div className="hidden min-w-0 md:block" aria-hidden>
        <p className="mb-2 text-sm font-semibold">{t('bp.picked')}</p>
        <ul className="space-y-1 text-xs">
          {picked.map((id, i) => {
            const name = a.rune(id).name;
            return name ? (
              <li key={id} className={i === 0 ? 'font-semibold text-gold' : 'text-muted'}>
                {name}
              </li>
            ) : null;
          })}
          {shards.map((id, i) => {
            const name = SHARD_INFO[id]?.name;
            return name ? (
              <li key={`s${i}`} className="text-faint">
                {name}
              </li>
            ) : null;
          })}
        </ul>
      </div>
    </div>
  );
}

/** The stat-shard grid as in the client: three rows of options, the chosen one in each row lit. */
export function ShardGrid({ shards }: { shards: number[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{t('bp.shards')}</p>
      <div className="space-y-1.5">
        {SHARD_ROWS.map((row, ri) => {
          const picked = shards[ri];
          // If Riot changes a row, still show the pick.
          const ids = picked != null && !row.ids.includes(picked) ? [...row.ids, picked] : row.ids;
          return (
            <div key={row.label} className="flex items-center gap-1.5" role="group" aria-label={row.label}>
              {ids.map((id, k) => {
                const on = id === picked;
                const info = SHARD_INFO[id];
                return (
                  <GameImg
                    key={`${id}-${k}`}
                    src={shardIcon(id)}
                    alt={on ? (info?.name ?? '') : ''}
                    size={24}
                    rounded="full"
                    className={clsx('bg-[#0e1b1d]! p-[3px] transition duration-300', on ? 'ring-2 ring-gold' : 'opacity-30 grayscale')}
                    tip={info ? <Tip title={t('bp.shardTip', { row: row.label, name: info.name })} body={info.desc} /> : undefined}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tree({ tree, picked, a, withKeystone }: { tree: StaticData['trees'][number]; picked: Set<number>; a: ReturnType<typeof assets>; withKeystone?: boolean }) {
  const rows = withKeystone ? tree.slots : tree.slots.slice(1);
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <GameImg src={`https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`} alt="" size={18} rounded="full" />
        {tree.name}
      </p>
      <div className="space-y-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {row.map((id) => {
              const r = a.rune(id);
              const on = picked.has(id);
              const big = withKeystone && ri === 0;
              return (
                <GameImg
                  key={id}
                  src={r.url}
                  alt={on ? r.name : ''}
                  size={big ? 36 : 28}
                  rounded="full"
                  className={clsx('bg-[#0e1b1d]! transition duration-300', on ? 'ring-2 ring-gold' : 'opacity-25 grayscale')}
                  tip={r.name ? <Tip title={r.name} body={r.desc} /> : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Item icon row with optional arrows, used for builds. */
export function ItemRow({ ids, size = 32, arrows, linked }: { ids: number[]; size?: number; arrows?: boolean; linked?: boolean }) {
  const { data } = useStaticData();
  const a = assets(data);
  return (
    <span className="flex items-center gap-1">
      {ids.map((id, i) => {
        const it = a.item(id);
        return (
          <span key={`${id}-${i}`} className="flex items-center gap-1">
            {linked ? (
              // Completed items open their page on the Items list: who else builds it, and how it does.
              <Link to={`/items?item=${id}`} className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
                <GameImg src={it.url} alt={it.name || `Item ${id}`} size={size} rounded="sm" tip={it.name ? <ItemTip id={id} note={t('it.openHint')} /> : undefined} />
              </Link>
            ) : (
              <GameImg src={it.url} alt={it.name || `Item ${id}`} size={size} rounded="sm" tip={it.name ? <ItemTip id={id} /> : undefined} />
            )}
            {arrows && i < ids.length - 1 && <ChevronRight className="size-3.5 text-faint" aria-hidden />}
          </span>
        );
      })}
    </span>
  );
}
