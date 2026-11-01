import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';

const ACTIVE = '[aria-selected="true"], [aria-current="page"], [aria-checked="true"]';

/**
 * A gold underline that glides to whichever tab is active. Drop it inside any positioned
 * tab bar: it finds the active tab by its ARIA state and follows it, so tabs need no wiring.
 */
export function SlidingIndicator({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  const [ready, setReady] = useState(false); // no slide on first paint, only on changes

  useLayoutEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const measure = () => {
      const active = [...host.children].find((el) => el.matches(ACTIVE)) as HTMLElement | undefined;
      setBox(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    };
    measure();
    const raf = requestAnimationFrame(() => setReady(true));
    const mo = new MutationObserver(measure);
    mo.observe(host, { attributes: true, subtree: true, attributeFilter: ['aria-selected', 'aria-current', 'aria-checked'] });
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden
      className={clsx(
        'pointer-events-none absolute bottom-0 left-0 h-[2px] rounded-full bg-gold',
        ready && 'transition-[translate,width,opacity] duration-[420ms] ease-[var(--ease-smooth)]',
        !box && 'opacity-0',
        className,
      )}
      style={box ? { width: box.width, translate: `${box.left}px 0` } : { width: 0 }}
    />
  );
}

/**
 * Smoothly opens and closes its content (height animates via a 0fr → 1fr grid row).
 * Content stays mounted while closing so the collapse is visible, then unmounts.
 */
export function Collapse({ open, id, children }: { open: boolean; id?: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) return setMounted(true);
    setShown(false);
    const t = setTimeout(() => setMounted(false), 420);
    return () => clearTimeout(t);
  }, [open]);

  // Once the closed state is in the DOM, force a style read, then open: the transition starts this frame.
  useLayoutEffect(() => {
    if (open && mounted && !shown) {
      ref.current?.getBoundingClientRect();
      setShown(true);
    }
  }, [open, mounted, shown]);

  if (!mounted) return null;
  return (
    <div
      ref={ref}
      id={id}
      className={clsx('collapse-grid grid', shown ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
    >
      <div className={clsx('min-h-0 overflow-hidden transition-transform duration-[420ms] ease-[var(--ease-smooth)]', shown ? 'translate-y-0' : '-translate-y-2')}>{children}</div>
    </div>
  );
}

/** Remembers the previous tab index so panels can slide in from the side they came from. */
export function useSlideDirection(index: number) {
  const prev = useRef(index);
  const dir = index === prev.current ? 0 : index > prev.current ? 1 : -1;
  useEffect(() => {
    prev.current = index;
  }, [index]);
  return dir;
}
