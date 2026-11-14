import { useEffect, useState } from 'react';

/**
 * Sticky sidebars that are taller than the window: a plain `top: 72px` pins the top, so the bottom of
 * the sidebar only shows when the whole page is scrolled to the end. Instead, when the sidebar doesn't
 * fit, stick it by its bottom (a negative top), so it scrolls along with the page until its last card
 * is in view and then stays there. Short sidebars keep the normal top offset.
 */
export function stickyTop(sidebarHeight: number, viewport: number, header = 72, gap = 16) {
  return sidebarHeight + header + gap <= viewport ? header : viewport - sidebarHeight - gap;
}

export function useStickyTop<T extends HTMLElement>(header = 72) {
  // A callback ref, so it also works when the sidebar mounts after a loading state.
  const [el, ref] = useState<T | null>(null);
  const [top, setTop] = useState(header);
  useEffect(() => {
    if (!el) return;
    const update = () => setTop(stickyTop(el.offsetHeight, window.innerHeight, header));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [el, header]);
  return { ref, style: { top } };
}
