import { useEffect, useRef } from 'react';
import { t } from '../../i18n';

/**
 * "Show more" button that also loads by itself when scrolled into view — up to `maxAuto`
 * times, so a long session doesn't quietly burn through the API key's request budget.
 */
export function AutoLoad({ onLoad, loading, loadedPages, maxAuto = 4, label }: { onLoad: () => void; loading: boolean; loadedPages: number; maxAuto?: number; label?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const auto = loadedPages <= maxAuto;
  useEffect(() => {
    if (!auto || !ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !loading) onLoad();
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [auto, loading, onLoad]);
  return (
    <button
      ref={ref}
      onClick={onLoad}
      disabled={loading}
      className="w-full rounded border border-dashed border-line-strong py-3 font-medium text-muted transition-colors hover:border-gold hover:text-text disabled:opacity-60"
    >
      {loading ? t('autoload.loading') : (label ?? t('autoload.more'))}
    </button>
  );
}
