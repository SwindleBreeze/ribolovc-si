import type { Bait } from '@/lib/advice';
import { BaitIllustration } from './BaitIllustration';
import { LureIllustration } from './LureIllustration';

export type TackleItem = { kind: 'bait'; key: Bait; label: string } | { kind: 'lure'; key: string; label: string };

/** A row of small drawn cards for the baits and lures a fish takes. */
export function TackleStrip({ items, testId }: { items: TackleItem[]; testId?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2" data-testid={testId}>
      {items.map((it) => (
        <li key={`${it.kind}-${it.key}`} className="flex flex-col border border-rule bg-paper">
          <span className="flex h-14 items-center justify-center px-2.5 pt-1.5">
            {it.kind === 'bait' ? (
              <BaitIllustration bait={it.key} className="h-auto w-full text-ink" />
            ) : (
              <LureIllustration slug={it.key} className="h-auto w-full text-ink" />
            )}
          </span>
          <span className="border-t border-rule-2 px-2 py-1.5 text-[13px] leading-tight">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
