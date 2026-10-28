import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="contour-bg border-b border-ink">
      <div className="mx-auto max-w-[1360px] px-4 py-24 md:px-8">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-[48px] font-semibold">{t('notFound.title')}</h1>
        <p className="mt-2 text-lg text-ink-2">{t('notFound.text')}</p>
        <Link href="/" className="btn btn-line mt-6">
          {t('nav.map')}
        </Link>
      </div>
    </div>
  );
}
