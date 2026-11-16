import { Link } from 'react-router';
import { useEffect } from 'react';
import { HeartHandshake, LayoutGrid, Package, Scale, Swords, Trophy, Users } from 'lucide-react';
import { t } from '../i18n';

export function NotFoundPage() {
  useEffect(() => {
    document.title = t('notFound.title');
  }, []);
  // A dead end with one button sends people back to the start; the main sections are one click away instead.
  const places = [
    { to: '/champions', icon: LayoutGrid, label: t('nav.champions') },
    { to: '/leaderboard', icon: Trophy, label: t('nav.ladder') },
    { to: '/multisearch', icon: Users, label: t('nav.multisearch') },
    { to: '/compare', icon: Scale, label: t('nav.compare') },
    { to: '/draft', icon: Swords, label: t('nav.draft') },
    { to: '/duo', icon: HeartHandshake, label: t('nav.duo') },
    { to: '/items', icon: Package, label: t('it.heading') },
  ];
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">{t('notFound.heading')}</h1>
      <p className="mt-2 text-muted">{t('notFound.body')}</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-gold px-4 py-2 font-semibold text-gold-ink">
        {t('notFound.cta')}
      </Link>
      <nav aria-label={t('notFound.elsewhere')} className="mt-10">
        <p className="text-sm text-muted">{t('notFound.elsewhere')}</p>
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          {places.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <Link to={to} className="inline-flex min-h-[24px] items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-gold/60 hover:text-text">
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
