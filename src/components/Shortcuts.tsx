import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { X } from 'lucide-react';
import { t } from '../i18n';

/** "g" then a letter: where it goes. */
export const GO_KEYS: Record<string, { to: string; label: () => string }> = {
  h: { to: '/', label: () => t('kbd.home') },
  c: { to: '/champions', label: () => t('nav.champions') },
  l: { to: '/leaderboard', label: () => t('nav.ladder') },
  m: { to: '/multisearch', label: () => t('nav.multisearch') },
  p: { to: '/compare', label: () => t('nav.compare') },
  d: { to: '/draft', label: () => t('nav.draft') },
  u: { to: '/duo', label: () => t('nav.duo') },
};

const typing = (el: EventTarget | null) => {
  const e = el as HTMLElement | null;
  return !!e && (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.tagName) || e.isContentEditable);
};

/**
 * Keyboard shortcuts for the whole site: "?" lists them, "g" then a letter jumps to a page
 * (GitHub-style), "/" focuses search (handled by the search box). Ignored while typing or with
 * Ctrl/Alt/⌘ held, so browser and screen-reader keys keep working.
 */
export function Shortcuts() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const pending = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
      if (e.key === '?') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === 'g') {
        pending.current = Date.now();
        return;
      }
      const go = GO_KEYS[e.key];
      if (go && Date.now() - pending.current < 1500) {
        e.preventDefault();
        pending.current = 0;
        setOpen(false);
        nav(go.to);
      }
    };
    const show = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('rw:shortcuts', show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('rw:shortcuts', show);
    };
  }, [nav]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const Key = ({ k }: { k: string }) => <kbd className="inline-grid min-w-6 place-items-center rounded border border-line-strong bg-sunken px-1.5 font-mono text-xs text-text">{k}</kbd>;
  return (
    <dialog
      ref={dialog}
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === dialog.current && setOpen(false)}
      aria-labelledby="kbd-h"
      className="m-auto w-[min(92vw,420px)] rounded-lg border border-line bg-surface p-5 text-text shadow-2xl backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between">
        <h2 id="kbd-h" className="font-display text-2xl font-bold">
          {t('kbd.title')}
        </h2>
        <button onClick={() => setOpen(false)} aria-label={t('kbd.close')} className="grid size-8 place-items-center rounded text-muted hover:bg-raised hover:text-text">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
        <dt><Key k="/" /></dt>
        <dd className="text-muted">{t('kbd.search')}</dd>
        <dt><Key k="?" /></dt>
        <dd className="text-muted">{t('kbd.help')}</dd>
        {Object.entries(GO_KEYS).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="flex items-center gap-1">
              <Key k="g" /> <Key k={k} />
            </dt>
            <dd className="text-muted">{t('kbd.goTo', { page: v.label() })}</dd>
          </div>
        ))}
        <dt><Key k="Esc" /></dt>
        <dd className="text-muted">{t('kbd.esc')}</dd>
      </dl>
    </dialog>
  );
}
