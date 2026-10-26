import clsx from 'clsx';
import type { PlayerTag } from '../../lib/tags';

export function TagList({ tags, className }: { tags: PlayerTag[]; className?: string }) {
  if (!tags.length) return null;
  return (
    <ul className={clsx('flex flex-wrap gap-1.5', className)} aria-label="Player tags">
      {tags.map((t) => (
        <li
          key={t.id}
          title={t.detail}
          className={clsx(
            'rounded-sm border px-1.5 py-px text-xs font-medium',
            t.tone === 'good' && 'border-win/40 bg-win-tint text-win',
            t.tone === 'bad' && 'border-loss/40 bg-loss-tint text-loss',
            t.tone === 'neutral' && 'border-line-strong text-muted',
          )}
        >
          {t.label}
          <span className="sr-only">: {t.detail}</span>
        </li>
      ))}
    </ul>
  );
}
