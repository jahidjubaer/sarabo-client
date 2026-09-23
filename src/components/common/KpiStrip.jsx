import { cn } from '../../lib/utils';

// A single row of key numbers in one bordered strip - replaces grids of
// separate stat cards. Numbers only; no icons, no trend arrows, no colour
// coding. Values the caller does not have should be passed as null, which
// renders an em dash rather than a false zero.
//
//   <KpiStrip label="Last 7 days" items={[{ label: 'New requests', value: 38 },
//     { label: 'Payouts to process', value: '৳46,200', numeric: true }]} />
//
// `numeric` sets the value in the tabular mono face (money, counts with units).
function KpiStrip({ items, label, className }) {
    return (
        <dl
            aria-label={label}
            className={cn(
                'grid grid-cols-2 gap-px overflow-hidden rounded-ds-lg border border-ds-border bg-ds-border',
                items.length >= 4 ? 'lg:grid-cols-4' : items.length === 3 ? 'sm:grid-cols-3' : '',
                className
            )}
        >
            {items.map((item) => (
                <div key={item.label} className="flex flex-col gap-1 bg-ds-card px-5 py-4 [&:last-child:nth-child(odd)]:col-span-2 sm:[&:last-child:nth-child(odd)]:col-span-1">
                    <dt className="text-body-sm font-semibold text-ds-muted-foreground">{item.label}</dt>
                    <dd className={cn('text-title text-ds-foreground', item.numeric && 'ds-numeric text-heading')}>
                        {item.value ?? '—'}
                    </dd>
                    {item.hint ? <dd className="text-micro text-ds-muted-foreground">{item.hint}</dd> : null}
                </div>
            ))}
        </dl>
    );
}

export { KpiStrip };
