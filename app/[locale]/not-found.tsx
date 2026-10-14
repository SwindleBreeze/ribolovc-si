import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-5xl" aria-hidden="true">🎣</p>
      <h1 className="mt-4 text-2xl font-bold">404</h1>
      <p className="muted mt-2">{t('home.noResults')}</p>
      <Link href="/" className="btn btn-primary mt-6">
        {t('nav.map')}
      </Link>
    </div>
  );
}
