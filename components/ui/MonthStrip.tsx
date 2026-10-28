/** Twelve-month strip with the good months filled. */
export function MonthStrip({ months, locale, label }: { months: number[]; locale: string; label: string }) {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'narrow' });
  const long = new Intl.DateTimeFormat(locale, { month: 'long' });
  const names = months
    .slice()
    .sort((a, b) => a - b)
    .map((m) => long.format(new Date(2024, m - 1, 15)))
    .join(', ');
  return (
    <span role="img" aria-label={`${label}: ${names}`} className="num flex gap-0.5 text-[10px]">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
        <span
          key={m}
          aria-hidden="true"
          className={`flex-1 py-0.5 text-center ${months.includes(m) ? 'bg-brand text-paper' : 'bg-land text-muted'}`}
        >
          {fmt.format(new Date(2024, m - 1, 15))}
        </span>
      ))}
    </span>
  );
}
