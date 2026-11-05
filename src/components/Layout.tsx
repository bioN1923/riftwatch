import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Globe, Monitor, Moon, Sun, X } from 'lucide-react';
import clsx from 'clsx';
import { SearchBox } from './SearchBox';
import { api } from '../lib/api';
import { useRegion, useTheme, type Theme } from '../lib/storage';
import { LANGS, setLang, t, useLang, type Lang } from '../i18n';

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={clsx('flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight', className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-label={t('layout.home')} role="img">
        <path d="M16 4l10 5.8v12.4L16 28 6 22.2V9.8z" fill="none" stroke="var(--gold)" strokeWidth="2.4" />
        <path d="M16 11l4.3 2.5v5L16 21l-4.3-2.5v-5z" fill="var(--gold)" />
      </svg>
      <span className="hidden sm:inline">Riftwatch</span>
    </Link>
  );
}

const THEMES: { id: Theme; label: () => string; Icon: typeof Sun }[] = [
  { id: 'light', label: () => t('theme.light'), Icon: Sun },
  { id: 'system', label: () => t('theme.system'), Icon: Monitor },
  { id: 'dark', label: () => t('theme.dark'), Icon: Moon },
];

function ThemeSwitch() {
  const [theme, setTheme] = useTheme();
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[1];
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  return (
    <>
      <button
        onClick={() => setTheme(next.id)}
        aria-label={t('theme.switch', { current: current.label(), next: next.label().toLowerCase() })}
        className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted sm:hidden"
      >
        <current.Icon className="size-4" aria-hidden />
      </button>
    <div role="radiogroup" aria-label={t('theme.label')} className="hidden rounded-lg border border-line bg-surface p-0.5 sm:flex">
      {THEMES.map(({ id, label, Icon }) => (
        <button
          key={id}
          role="radio"
          aria-checked={theme === id}
          aria-label={label()}
          title={label()}
          onClick={() => setTheme(id)}
          className={clsx('grid size-8 place-items-center rounded-md transition-colors', theme === id ? 'bg-raised text-text' : 'text-faint hover:text-text')}
        >
          <Icon className="size-4" aria-hidden />
        </button>
      ))}
    </div>
    </>
  );
}

/** Language picker: shows the language code, opens the native list of languages. */
/** Language menu: a styled list (native select pop-ups ignore the dark theme on Windows). */
function LanguagePicker() {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const current = LANGS.findIndex((l) => l.id === lang);

  useEffect(() => {
    if (!open) return;
    setActive(current);
    listRef.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, current]);

  const choose = (id: Lang) => {
    setOpen(false);
    if (id !== lang) void setLang(id);
    else btnRef.current?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      btnRef.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + LANGS.length) % LANGS.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(LANGS[active].id);
    } else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('lang.label')}: ${LANGS[current]?.name ?? ''}`}
        className={clsx(
          'flex h-9 items-center gap-1.5 rounded-lg border bg-surface px-2.5 text-sm font-semibold transition-colors hover:text-text',
          open ? 'border-gold text-text' : 'border-line text-muted',
        )}
      >
        <Globe className="size-4" aria-hidden />
        <span aria-hidden>{lang.toUpperCase()}</span>
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label={t('lang.label')}
          aria-activedescendant={`lang-${LANGS[active].id}`}
          onKeyDown={onKey}
          className="drop-in absolute right-0 top-[calc(100%+6px)] z-50 min-w-48 overflow-hidden rounded-md border border-line-strong bg-surface py-1 text-sm shadow-2xl outline-none"
        >
          {LANGS.map((l, i) => (
            <li
              key={l.id}
              id={`lang-${l.id}`}
              role="option"
              aria-selected={l.id === lang}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(l.id)}
              className={clsx('flex cursor-pointer items-center gap-3 px-3 py-2', i === active ? 'bg-raised text-text' : 'text-muted')}
            >
              <span className="w-6 font-display text-xs font-bold text-faint">{l.id.toUpperCase()}</span>
              <span className="flex-1">{l.name}</span>
              {l.id === lang && <Check className="size-4 text-gold" aria-hidden />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DemoBanner() {
  const { data } = useQuery({ queryKey: ['health'], queryFn: api.health, staleTime: Infinity, retry: false });
  if (data?.mode !== 'demo') return null;
  return (
    <aside aria-label={t('demo.label')} className="border-b border-line bg-sunken px-4 py-1.5 text-center text-xs text-muted">
      {t.rich('demo.text', { key: <code className="text-text">RIOT_API_KEY</code>, file: <code className="text-text">.env</code> })}
    </aside>
  );
}

/** Riot's own incident and maintenance notices for the selected region. */
function StatusBanner() {
  const [region] = useRegion();
  const [hidden, setHidden] = useState<string[]>([]);
  const { data } = useQuery({ queryKey: ['status', region], queryFn: ({ signal }) => api.status(region, signal), staleTime: 5 * 60_000, refetchInterval: 5 * 60_000, retry: false });
  const notices = (data?.notices ?? []).filter((n) => !hidden.includes(n.id));
  if (!notices.length) return null;
  return (
    <aside aria-label={t('status.label')} className="border-b border-kda-great/40 bg-kda-great/10">
      {notices.slice(0, 2).map((n) => (
        <div key={n.id} className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-2 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-kda-great" aria-hidden />
          <p className="min-w-0 flex-1">
            <span className="font-semibold">{n.kind === 'maintenance' ? t('status.maintenance') : t('status.incident')}:</span> {n.title}
            {n.detail && <span className="text-muted"> — {n.detail.length > 160 ? `${n.detail.slice(0, 157)}…` : n.detail}</span>}
          </p>
          <button onClick={() => setHidden((h) => [...h, n.id])} aria-label={t('status.dismiss')} className="rounded p-0.5 text-muted hover:text-text">
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </aside>
  );
}

function MainNav() {
  const link = ({ isActive }: { isActive: boolean }) =>
    clsx('relative px-2 py-1 font-display text-lg font-bold tracking-wide transition-colors', isActive ? 'text-text' : 'text-muted hover:text-text');
  return (
    <nav aria-label={t('layout.mainNav')} className="hidden items-center gap-1 lg:flex">
      <NavLink to="/" end className={link}>
        {t('nav.players')}
      </NavLink>
      <NavLink to="/champions" className={link}>
        {t('nav.champions')}
      </NavLink>
      <NavLink to="/leaderboard" className={link}>
        {t('nav.ladder')}
      </NavLink>
      <NavLink to="/multisearch" className={link}>
        {t('nav.multisearch')}
      </NavLink>
      <NavLink to="/compare" className={link}>
        {t('nav.compare')}
      </NavLink>
    </nav>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const home = pathname === '/';
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-gold-ink">
        {t('layout.skip')}
      </a>
      <DemoBanner />
      <StatusBanner />
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-4">
          <Logo />
          <MainNav />
          <div className="flex min-w-0 flex-1 justify-center">{!home && <SearchBox />}</div>
          <LanguagePicker />
          <ThemeSwitch />
        </div>
      </header>
      <main id="main" className="flex-1">
        <div key={pathname.replace(/\/(live|stats)$/, '')} className="fade-in">
          <Outlet />
        </div>
      </main>
      <nav aria-label={t('layout.mainNav')} className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-line bg-bg/95 backdrop-blur lg:hidden">
        <NavLink to="/" end className={({ isActive }) => clsx('py-3 text-center font-display text-lg font-bold', isActive ? 'text-gold' : 'text-muted')}>
          {t('nav.players')}
        </NavLink>
        <NavLink to="/champions" className={({ isActive }) => clsx('py-3 text-center font-display text-lg font-bold', isActive ? 'text-gold' : 'text-muted')}>
          {t('nav.champions')}
        </NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => clsx('py-3 text-center font-display text-lg font-bold', isActive ? 'text-gold' : 'text-muted')}>
          {t('nav.ladder')}
        </NavLink>
        <NavLink to="/multisearch" className={({ isActive }) => clsx('py-3 text-center font-display text-lg font-bold', isActive ? 'text-gold' : 'text-muted')}>
          {t('nav.lobby')}
        </NavLink>
      </nav>
      <footer className="border-t border-line py-6 text-center text-xs text-faint">
        {t('footer.legal')}
      </footer>
    </div>
  );
}
