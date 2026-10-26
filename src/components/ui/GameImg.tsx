import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface Props {
  src?: string;
  alt: string;
  size: number;
  className?: string;
  rounded?: 'sm' | 'md' | 'full';
  tip?: ReactNode;
}

/** Fixed-size game icon with an empty-slot placeholder while loading or when the asset is missing. */
export function GameImg({ src, alt, size, className, rounded = 'md', tip }: Props) {
  const [failed, setFailed] = useState(false);
  const radius = rounded === 'full' ? 'rounded-full' : rounded === 'sm' ? 'rounded-[3px]' : 'rounded-[5px]';
  const box = (
    <span
      className={clsx('relative inline-block shrink-0 overflow-hidden bg-sunken align-middle', radius, className)}
      style={{ width: size, height: size }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="block h-full w-full object-cover"
        />
      ) : (
        <span role={alt ? 'img' : undefined} aria-label={alt || undefined} className="block h-full w-full" />
      )}
    </span>
  );
  if (!tip) return box;
  return <Tooltip content={tip}>{box}</Tooltip>;
}

/**
 * Hover tooltip rendered into <body> with fixed positioning, so it never gets clipped by
 * (or adds scrollbars to) the scrolling container it sits in.
 */
export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchor || !tipRef.current) return;
    const t = tipRef.current.getBoundingClientRect();
    const margin = 8;
    let left = anchor.left + anchor.width / 2 - t.width / 2;
    left = Math.max(margin, Math.min(window.innerWidth - t.width - margin, left));
    let top = anchor.top - t.height - 6;
    if (top < margin) top = anchor.bottom + 6;
    setPos({ left, top });
  }, [anchor]);

  const show = () => {
    if (ref.current) setAnchor(ref.current.getBoundingClientRect());
  };
  const hide = () => {
    setAnchor(null);
    setPos(null);
  };

  return (
    <span ref={ref} className="inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {anchor &&
        createPortal(
          <span
            ref={tipRef}
            role="tooltip"
            style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
            className="tip-in pointer-events-none fixed z-[100] w-max max-w-64 rounded border border-line-strong bg-raised px-2.5 py-1.5 text-left text-xs leading-snug text-text shadow-xl"
          >
            {content}
          </span>,
          document.body,
        )}
    </span>
  );
}
