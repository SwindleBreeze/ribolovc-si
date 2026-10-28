'use client';

import { Link, usePathname } from '@/i18n/navigation';

export function NavLinks({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  return (
    <nav aria-label={label} className="order-last -mx-1 flex w-full gap-5 overflow-x-auto px-1 text-[15px] md:order-none md:w-auto">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={isActive(i.href) ? 'page' : undefined}
          className={`whitespace-nowrap border-b-2 pb-0.5 no-underline ${isActive(i.href) ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink'}`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
