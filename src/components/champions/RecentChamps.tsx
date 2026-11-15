import { Link } from 'react-router';
import type { StatsGroup } from '../../../shared/types';
import { assets, champSlug, useStaticData } from '../../lib/ddragon';
import type { RecentChamp } from '../../lib/storage';
import { GameImg } from '../ui/GameImg';
import { RoleIcon, ROLE_LABEL } from '../ui/RoleIcon';

/** Champion pages opened lately in this browser, one click back (in the role they were viewed in). */
export function RecentChampList({ list, group = 'ranked' }: { list: RecentChamp[]; group?: StatsGroup }) {
  const { data: sd } = useStaticData();
  const a = assets(sd);
  return (
    <ul className="flex flex-wrap gap-1.5">
      {list.map((r) => {
        const c = sd?.champions.get(r.id);
        if (!c) return null;
        const q = new URLSearchParams();
        if (group !== 'ranked') q.set('queue', group);
        else if (r.role) q.set('role', r.role);
        const label = r.role && group === 'ranked' ? `${c.name} · ${ROLE_LABEL[r.role] ?? r.role}` : c.name;
        return (
          <li key={r.id}>
            <Link to={`/champions/${champSlug(c.id)}${q.size ? `?${q}` : ''}`} aria-label={label} className="group relative block rounded-[5px] ring-1 ring-line transition hover:-translate-y-0.5 hover:ring-gold">
              <GameImg src={a.champion(r.id).url} alt="" size={34} rounded="md" tip={label} />
              {r.role && group === 'ranked' && (
                <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-sm bg-bg text-muted ring-1 ring-line" aria-hidden>
                  <RoleIcon role={r.role} size={10} />
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
