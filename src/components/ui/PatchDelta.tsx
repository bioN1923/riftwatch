import clsx from 'clsx';
import { pct } from '../../lib/format';
import { t } from '../../i18n';

/**
 * Is a win-rate change between two patches bigger than chance? Needs at least two standard errors of
 * the difference (the same bar as Patch movers). Without game counts we can't tell, so we trust it.
 */
export function realChange(now: number, before: number, games?: number, prevGames?: number) {
  if (!games || !prevGames) return true;
  return Math.abs(now - before) >= 2 * Math.sqrt(0.25 / games + 0.25 / prevGames);
}

/**
 * "+1.2%" / "−0.8%": change in win rate since the previous patch. Tiny changes are shown as "±0", and
 * a change within normal swing for the number of games is grey instead of green or red.
 */
export function PatchDelta({ now, before, games, prevGames, className }: { now: number; before?: number; games?: number; prevGames?: number; className?: string }) {
  if (before == null) return null;
  const d = now - before;
  const flat = Math.abs(d) < 0.005;
  const real = realChange(now, before, games, prevGames);
  const tip = t('mv.deltaTip', { before: pct(before, 1), now: pct(now, 1) });
  return (
    <span
      className={clsx('num text-[11px] font-medium', flat || !real ? 'text-faint' : d > 0 ? 'text-win' : 'text-loss', className)}
      title={real || flat ? tip : `${tip} · ${t('mv.noise')}`}
    >
      {flat ? '±0' : `${d > 0 ? '+' : '−'}${pct(Math.abs(d), 1)}`}
    </span>
  );
}
