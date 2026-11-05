import { Link } from 'react-router';
import { useEffect } from 'react';
import { t } from '../i18n';

export function NotFoundPage() {
  useEffect(() => {
    document.title = t('notFound.title');
  }, []);
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">{t('notFound.heading')}</h1>
      <p className="mt-2 text-muted">{t('notFound.body')}</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-gold px-4 py-2 font-semibold text-gold-ink">
        {t('notFound.cta')}
      </Link>
    </div>
  );
}
