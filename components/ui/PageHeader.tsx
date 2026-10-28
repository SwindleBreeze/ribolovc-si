import type { ReactNode } from 'react';

/** Contour-textured page header: eyebrow, serif title, lede and an optional data strip. */
export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="contour-bg border-b border-ink">
      <div className="mx-auto max-w-[1360px] px-4 pt-8 md:px-8">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 max-w-[22ch] text-[40px] font-semibold leading-[1.04] tracking-tight md:text-[60px]">{title}</h1>
        {lede && <p className="mt-3 max-w-[62ch] text-lg text-ink-2 md:text-[19px]">{lede}</p>}
        <div className={children ? 'mt-7' : 'pb-8'}>{children}</div>
      </div>
    </section>
  );
}

/** Definition-list strip of key facts, separated by thin rules. */
export function DataStrip({ items }: { items: { label: string; value: ReactNode; mono?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-2 border-t border-ink sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
      {items.map((it, i) => (
        <div key={it.label} className={`px-0 py-3 pr-4 sm:px-4 ${i > 0 ? 'sm:border-l sm:border-rule' : 'sm:pl-0'} ${i % 2 === 1 ? 'border-l border-rule pl-4 sm:pl-4' : ''}`}>
          <dt className="label">{it.label}</dt>
          <dd className={`mt-1 ${it.mono ? 'num' : 'font-medium'}`}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Section heading in the serif face with an optional right-aligned note. */
export function SectionTitle({ id, children, note }: { id?: string; children: ReactNode; note?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
      <h2 id={id} className="text-[28px] font-semibold md:text-[30px]">
        {children}
      </h2>
      {note && <span className="eyebrow !text-[11px]">{note}</span>}
    </div>
  );
}
