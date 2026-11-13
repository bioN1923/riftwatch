import clsx from 'clsx';
import { pct } from '../../lib/format';
import { t } from '../../i18n';

/** "+1.2%" / "−0.8%": change in win rate since the previous patch. Tiny changes are shown as "±0". */
export function PatchDelta({ now, before, className }: { now: number; before?: number; className?: string }) {
  if (before == null) return null;
  const d = now - before;
  const flat = Math.abs(d) < 0.005;
  return (
    <span
      className={clsx('num text-[11px] font-medium', flat ? 'text-faint' : d > 0 ? 'text-win' : 'text-loss', className)}
      title={t('mv.deltaTip', { before: pct(before, 1), now: pct(now, 1) })}
    >
      {flat ? '±0' : `${d > 0 ? '+' : '−'}${pct(Math.abs(d), 1)}`}
    </span>
  );
}
