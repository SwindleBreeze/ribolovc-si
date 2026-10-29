import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Photo } from '@/lib/schema';
import { site } from '@/lib/site';

/** Link to the "Photo" issue form, with the page already filled in. */
export function photoFormUrl(pagePath: string, title: string) {
  const q = new URLSearchParams({ template: 'photo.yml', title: `Fotografija: ${title}`, place: `${site.url}${pagePath}` });
  return `${site.issuesUrl}?${q}`;
}

/** Approved visitor photos for a section or spot; renders nothing when there are none. */
export async function PhotoGallery({ photos, addUrl }: { photos: Photo[]; addUrl: string }) {
  if (photos.length === 0) return null;
  const t = await getTranslations('photos');
  return (
    <section aria-labelledby="photos-h" className="mt-12" data-testid="photos">
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-ink pb-2">
        <h2 id="photos-h" className="text-[26px] font-semibold">
          {t('title')}
        </h2>
        <a href={addUrl} target="_blank" rel="noopener" className="text-sm">
          {t('add')}
        </a>
      </div>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {photos.map((p) => (
          <li key={p.src}>
            <figure>
              <a href={`/${p.src}`} target="_blank" rel="noopener" className="block bg-raised">
                <Image
                  src={`/${p.thumb}`}
                  alt={p.caption ?? t('alt', { author: p.author })}
                  width={p.width}
                  height={p.height}
                  unoptimized
                  loading="lazy"
                  className="aspect-[4/3] h-auto w-full object-cover"
                />
              </a>
              <figcaption className="mt-1.5 text-[13px] leading-snug">
                {p.caption && <span className="block">{p.caption}</span>}
                <span className="text-muted">{t('credit', { author: p.author })}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
