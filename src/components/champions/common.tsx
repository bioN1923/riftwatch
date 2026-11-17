import clsx from 'clsx';
import type { StatsGroup, TierRow } from '../../../shared/types';
import { RoleIcon } from '../ui/RoleIcon';
import { t } from '../../i18n';

export const ROLE_TABS = ['ALL', 'TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'].map((id) => ({
  id,
  get label() {
    return t(`role.${id}` as 'role.TOP');
  },
}));

export function TierBadge({ tier, size = 'md' }: { tier: TierRow['tier']; size?: 'md' | 'lg' }) {
  const tone =
    tier === 'S+' ? 'bg-gold text-gold-ink' : tier === 'S' ? 'border border-gold text-gold' : tier === 'A' ? 'border border-line-strong text-text' : tier === 'B' ? 'text-muted' : 'text-faint';
  const boxed = tier === 'S+' || tier === 'S' || tier === 'A';
  return (
    <span
      className={clsx(
        'inline-grid rounded-sm font-display font-extrabold leading-none',
        tone,
        size === 'lg'
          ? // Large and unboxed (B and below): sit on the label's left edge like the other stats, not centred in an invisible box.
            boxed ? 'h-10 min-w-12 place-items-center px-2 text-3xl' : 'text-3xl sm:text-4xl'
          : 'h-6 min-w-8 place-items-center px-1 text-base',
      )}
      title={tier === '–' ? t('tierBadge.unranked') : t('tierBadge.tier', { tier })}
    >
      {tier}
    </span>
  );
}

export function GroupToggle({ value, onChange }: { value: StatsGroup; onChange: (g: StatsGroup) => void }) {
  return (
    <div role="radiogroup" aria-label={t('queueToggle.label')} className="flex rounded border border-line bg-surface p-0.5">
      {(
        [
          ['ranked', t('queueToggle.ranked')],
          ['aram', t('queueToggle.aram')],
          ['arena', t('queueToggle.arena')],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={clsx('rounded-sm px-3 py-1 text-sm font-medium transition-colors', value === id ? 'bg-raised text-text' : 'text-muted hover:text-text')}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function PatchSelect({ patches, value, onChange }: { patches: string[]; value: string | null; onChange: (p: string) => void }) {
  if (patches.length <= 1) return value ? <span className="text-sm text-muted">{t('patch.value', { patch: value })}</span> : null;
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      {t('patch.label')}
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="rounded border border-line bg-surface px-2 py-1 text-text">
        {patches.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
    </label>
  );
}

export function RoleTab({ role, active, children, onClick }: { role: string; active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={clsx(
        '-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-medium transition-colors',
        active ? 'border-transparent text-text' : 'border-transparent text-muted hover:text-text',
      )}
    >
      {role !== 'ALL' && <RoleIcon role={role} size={15} />}
      {children}
    </button>
  );
}

/** Small win-rate bar centred on 50%: right of centre is above even. */
export function WinRateBar({ value }: { value: number }) {
  const off = Math.max(-0.05, Math.min(0.05, value - 0.5)) / 0.05; // -1..1, full bar at ±5 points
  // The track is drawn in the divider colour so a short bar still reads as "a bit above 50%", not a stray tick.
  return (
    <span className="relative inline-block h-1.5 w-16 rounded-full bg-line align-middle" aria-hidden>
      <span className="absolute inset-y-[-3px] left-1/2 w-px bg-muted" />
      <span
        className={clsx('grow-x absolute inset-y-0 rounded-full', off >= 0 ? 'left-1/2 origin-left bg-win' : 'right-1/2 origin-right bg-loss')}
        style={{ width: `${Math.abs(off) * 50}%` }}
      />
    </span>
  );
}
