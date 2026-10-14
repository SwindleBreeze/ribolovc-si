import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function DonateCta() {
  const t = await getTranslations('support');
  return (
    <aside className="card mt-10 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-medium">{t('cta')}</p>
      <Link href="/podpri" className="btn btn-primary">
        ☕ {t('button')}
      </Link>
    </aside>
  );
}
