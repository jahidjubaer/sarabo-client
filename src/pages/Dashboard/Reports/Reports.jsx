import { lazy, Suspense } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { useUrlFilters } from '../../../hooks/useUrlFilters';
import { getAdminReport } from '../../../api/adminReports';
import { PageHeader } from '../../../components/common/PageHeader';
import { Section } from '../../../components/common/Section';
import { KpiStrip } from '../../../components/common/KpiStrip';
import { ErrorState } from '../../../components/common/ErrorState';
import { Skeleton } from '../../../components/ui/skeleton';
import { Badge } from '../../../components/ui/badge';
import { Select } from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/table';
import { PICKUP_SLOT_LABELS } from '../../../utils/pickupSlots';
import {
    REPORT_RANGES, TREND_SERIES, PICKUP_WEEKDAYS, PICKUP_SLOT_SHORT_LABELS, normalizeRange, formatReportDate, formatCount, formatPercent, formatDays,
    previousHint, labelSlug, heatStep,
} from '../../../utils/reportPresentation';
import { cn } from '../../../lib/utils';
import { formatMoney } from '../../../utils/currency';

// Inspection fees in the period (job-portal phases C/D): paid to book a
// technician, refunded, or kept when the repair did not go ahead - a kept fee
// is split 90% technician, 10% Sarabo.
function InspectionFeeReport({ fees }) {
    const money = (amount) => formatMoney(amount, fees.currency || 'BDT');
    const kept = fees.kept;
    return (
        <Section
            title="Inspection fees"
            description="Fees customers paid to book a technician. A fee counts toward the repair price; if the repair doesn't go ahead it is refunded, or kept and split 90% technician, 10% Sarabo."
            variant="card"
            actions={fees.refundPending.count > 0 ? <Badge tone="attention"><TriangleAlert aria-hidden="true" />{fees.refundPending.count} refund{fees.refundPending.count === 1 ? '' : 's'} waiting on Stripe</Badge> : null}
        >
            <KpiStrip
                label="Inspection fees"
                items={[
                    { label: 'Paid', value: money(fees.paid.amount), hint: `${formatCount(fees.paid.count)} fee${fees.paid.count === 1 ? '' : 's'}` },
                    { label: 'Refunded', value: money(fees.refunded.amount), hint: `${formatCount(fees.refunded.count)} refund${fees.refunded.count === 1 ? '' : 's'}` },
                    { label: 'Kept', value: money(kept.amount), hint: `${formatCount(kept.count)} fee${kept.count === 1 ? '' : 's'}` },
                    { label: "Sarabo's share", value: money(kept.saraboShare), hint: `Technicians got ${money(kept.technicianShare)}` },
                ]}
            />
            <p className="mt-3 text-body-sm text-ds-muted-foreground">
                Kept because the customer declined the price: <span className="font-semibold text-ds-foreground">{formatCount(kept.quoteDeclined)}</span>.
                {' '}Kept because the customer cancelled less than 2 hours before the visit: <span className="font-semibold text-ds-foreground">{formatCount(kept.lateCancellations)}</span>.
            </p>
        </Section>
    );
}

// recharts is large; the one line chart loads separately from the page.
const RequestsTrendChart = lazy(() => import('../../../components/admin/reports/RequestsTrendChart'));

const reportKeys = { range: (days) => ['admin-report', days] };

function TrendLegend() {
    return (
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm text-ds-foreground" aria-label="Legend">
            {TREND_SERIES.map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
                    {s.name}
                </li>
            ))}
        </ul>
    );
}

// The same numbers as the chart, for screen readers and anyone who prefers a table.
function TrendTable({ daily }) {
    return (
        <details className="mt-3 text-body-sm">
            <summary className="focus-ring cursor-pointer rounded-ds-sm font-semibold text-ds-foreground">Show as a table</summary>
            <div className="mt-2 max-h-72 overflow-y-auto">
                <Table>
                    <caption className="sr-only">Requests made and repairs finished per day</caption>
                    <TableHeader><TableRow><TableHead scope="col">Day</TableHead><TableHead scope="col" className="text-right">Requests made</TableHead><TableHead scope="col" className="text-right">Repairs finished</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {daily.map((d) => (
                            <TableRow key={d.date}>
                                <TableCell>{formatReportDate(d.date, { weekday: 'short' })}</TableCell>
                                <TableCell className="ds-numeric text-right">{d.created}</TableCell>
                                <TableCell className="ds-numeric text-right">{d.completed}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </details>
    );
}

// A labelled list with one bar per row - a single series, so one colour and
// no legend; the value is always written out.
function BarList({ title, rows }) {
    const max = Math.max(1, ...rows.map((r) => r.value));
    return (
        <div>
            <h3 className="text-subhead text-ds-foreground">{title}</h3>
            {rows.length === 0 ? (
                <p className="mt-2 text-body-sm text-ds-muted-foreground">No requests in this period.</p>
            ) : (
                <ul className="mt-3 space-y-2.5">
                    {rows.map((row) => (
                        <li key={row.key}>
                            <div className="flex items-baseline justify-between gap-3 text-body-sm">
                                <span className="truncate text-ds-foreground">{row.label}</span>
                                <span className="ds-numeric shrink-0 font-semibold text-ds-foreground">{row.value}</span>
                            </div>
                            <div className="mt-1 h-2 rounded-full bg-ds-muted" aria-hidden="true">
                                <div className="h-2 rounded-full" style={{ width: `${(row.value / max) * 100}%`, background: 'var(--ds-chart-1)' }} />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Day-of-week x time-slot grid. Every cell shows its count; the shade is a
// second cue, never the only one.
function PickupGrid({ pickupLoad, slots }) {
    const counts = new Map(pickupLoad.map((c) => [`${c.weekday}|${c.slotId}`, c.count]));
    const max = Math.max(0, ...pickupLoad.map((c) => c.count));
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] border-separate border-spacing-1 text-body-sm">
                <caption className="sr-only">Pickups booked by day of the week and time slot</caption>
                <thead>
                    <tr>
                        <th scope="col" className="w-10 text-left sm:w-28 text-micro font-semibold text-ds-muted-foreground"><span className="sr-only">Day</span></th>
                        {slots.map((slot) => (
                            <th key={slot.slotId} scope="col" className="px-1 pb-1 text-center text-micro font-semibold text-ds-muted-foreground">
                                <span aria-hidden="true" className="sm:hidden">{PICKUP_SLOT_SHORT_LABELS[slot.slotId] || slot.slotId}</span>
                                <span className="sr-only sm:not-sr-only">{PICKUP_SLOT_LABELS[slot.slotId] || slot.label}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {PICKUP_WEEKDAYS.map((day) => (
                        <tr key={day.weekday}>
                            <th scope="row" className="pr-2 text-left font-semibold text-ds-foreground">
                                <span aria-hidden="true" className="sm:hidden">{day.label.slice(0, 3)}</span>
                                <span className="sr-only sm:not-sr-only">{day.label}</span>
                            </th>
                            {slots.map((slot) => {
                                const count = counts.get(`${day.weekday}|${slot.slotId}`) || 0;
                                if (day.closed) {
                                    return <td key={slot.slotId} className="rounded-ds-sm bg-ds-muted/50 py-2 text-center text-micro text-ds-muted-foreground">Closed</td>;
                                }
                                const step = heatStep(count, max);
                                return (
                                    <td
                                        key={slot.slotId}
                                        title={`${day.label}, ${PICKUP_SLOT_LABELS[slot.slotId]}: ${count} pickup${count === 1 ? '' : 's'}`}
                                        className="ds-numeric rounded-ds-sm py-2 text-center font-semibold"
                                        style={{ background: `var(--ds-heat-${step})`, color: `var(--ds-heat-${step}-foreground)` }}
                                    >
                                        {count}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RegionTable({ regions }) {
    if (regions.length === 0) return <p className="text-body-sm text-ds-muted-foreground">No requests or technicians yet.</p>;
    return (
        <>
            <div className="hidden md:block">
                <Table>
                    <caption className="sr-only">Requests and technicians per region</caption>
                    <TableHeader>
                        <TableRow>
                            <TableHead scope="col">Region</TableHead>
                            <TableHead scope="col" className="text-right">Requests</TableHead>
                            <TableHead scope="col" className="text-right">Waiting now</TableHead>
                            <TableHead scope="col">No local technician</TableHead>
                            <TableHead scope="col" className="text-right">Turned away</TableHead>
                            <TableHead scope="col" className="text-right">Technicians</TableHead>
                            <TableHead scope="col" className="text-right">Free now</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {regions.map((r) => (
                            <TableRow key={r.region}>
                                <TableCell className="font-medium text-ds-foreground">{r.region}</TableCell>
                                <TableCell className="ds-numeric text-right">{r.requests}</TableCell>
                                <TableCell className="ds-numeric text-right">{r.waiting}</TableCell>
                                <TableCell>
                                    {r.unmatchedWaiting > 0
                                        ? <Badge tone="attention"><TriangleAlert aria-hidden="true" />{r.unmatchedWaiting} can't be matched</Badge>
                                        : <span className="text-ds-muted-foreground">None</span>}
                                </TableCell>
                                <TableCell className="ds-numeric text-right">{r.turnedAway ?? 0}</TableCell>
                                <TableCell className="ds-numeric text-right">{r.approvedTechnicians}</TableCell>
                                <TableCell className="ds-numeric text-right">{r.availableTechnicians}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <ul className="space-y-3 md:hidden">
                {regions.map((r) => (
                    <li key={r.region} className="rounded-ds-lg border border-ds-border bg-ds-card p-4">
                        <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-ds-foreground">{r.region}</p>
                            {r.unmatchedWaiting > 0 && <Badge tone="attention"><TriangleAlert aria-hidden="true" />{r.unmatchedWaiting} can't be matched</Badge>}
                        </div>
                        <dl className="mt-2 grid grid-cols-2 gap-2 text-body-sm">
                            <div><dt className="text-micro text-ds-muted-foreground">Requests</dt><dd className="ds-numeric">{r.requests}</dd></div>
                            <div><dt className="text-micro text-ds-muted-foreground">Waiting now</dt><dd className="ds-numeric">{r.waiting}</dd></div>
                            <div><dt className="text-micro text-ds-muted-foreground">Technicians</dt><dd className="ds-numeric">{r.approvedTechnicians}</dd></div>
                            <div><dt className="text-micro text-ds-muted-foreground">Free now</dt><dd className="ds-numeric">{r.availableTechnicians}</dd></div>
                            <div><dt className="text-micro text-ds-muted-foreground">Turned away</dt><dd className="ds-numeric">{r.turnedAway ?? 0}</dd></div>
                        </dl>
                    </li>
                ))}
            </ul>
        </>
    );
}

function TopTechnicians({ rows }) {
    if (rows.length === 0) return <p className="text-body-sm text-ds-muted-foreground">No repairs were finished in this period.</p>;
    return (
        <Table>
            <caption className="sr-only">Technicians who finished the most repairs</caption>
            <TableHeader>
                <TableRow>
                    <TableHead scope="col">Technician</TableHead>
                    <TableHead scope="col">Region</TableHead>
                    <TableHead scope="col" className="text-right">Finished</TableHead>
                    <TableHead scope="col" className="text-right">On a job now</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map((t) => (
                    <TableRow key={t.technicianId}>
                        <TableCell className="font-medium text-ds-foreground">{t.name}</TableCell>
                        <TableCell className="text-ds-muted-foreground">{t.region || '—'}</TableCell>
                        <TableCell className="ds-numeric text-right">{t.completed}</TableCell>
                        <TableCell className="text-right">{t.active > 0 ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function ReportSkeleton() {
    return (
        <div className="space-y-6" aria-hidden="true">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-72 w-full" />
            <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>
        </div>
    );
}

// Admin reports (reports phase): how much work comes in and gets done, where
// demand outruns local technicians, what breaks most, when pickups cluster,
// and how busy technicians are. Read-only.
const Reports = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useUrlFilters({ days: '30' });
    const days = normalizeRange(filters.days);
    const { data, isPending, isPaused, isError, isFetching } = useQuery({
        queryKey: reportKeys.range(days),
        queryFn: () => getAdminReport(axiosSecure, days),
        placeholderData: keepPreviousData,
    });

    const rangeControl = (
        <div className="flex items-center gap-2">
            <Label htmlFor="report-range" className="sr-only">Period</Label>
            <Select id="report-range" size="sm" value={days} onChange={(e) => setFilters({ days: e.target.value })} wrapperClassName="w-44">
                {REPORT_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
        </div>
    );
    const header = (
        <PageHeader
            title="Reports"
            description="Work coming in and getting done, where requests wait for technicians, and when pickups happen. Days are Bangladesh days."
            actions={rangeControl}
        />
    );

    if (!data && (isError || isPaused)) {
        return (
            <div className="space-y-6">
                {header}
                <ErrorState title="Couldn't load the report" description="Please try again in a moment." onRetry={() => queryClient.resetQueries({ queryKey: reportKeys.range(days) })} />
            </div>
        );
    }
    if (!data || (isPending && !isPaused)) {
        return <div className="space-y-6">{header}<ReportSkeleton /></div>;
    }

    const o = data.overview;
    const period = data.range.days;
    const unmatchedTotal = data.regions.reduce((sum, r) => sum + r.unmatchedWaiting, 0);
    const w = data.workload;

    return (
        <div className="space-y-8">
            {header}
            <p className={cn('-mt-4 text-sm text-ds-muted-foreground transition-opacity', isFetching ? 'opacity-100' : 'opacity-0')} role="status" aria-live="polite">Updating…</p>

            <Section title="Overview" description={`${REPORT_RANGES.find((r) => r.value === days)?.label}, compared with the ${period} days before.`}>
                <KpiStrip
                    label="Overview"
                    items={[
                        { label: 'Requests made', value: formatCount(o.created), hint: previousHint(o.previous.created, period) },
                        { label: 'Repairs finished', value: formatCount(o.completed), hint: previousHint(o.previous.completed, period) },
                        { label: 'Cancelled', value: formatCount(o.cancelled), hint: previousHint(o.previous.cancelled, period) },
                        { label: 'Success rate', value: formatPercent(o.successRate), hint: previousHint(o.previous.successRate, period, formatPercent) },
                        { label: 'Turned away', value: formatCount(o.turnedAway), hint: previousHint(o.previous.turnedAway, period) },
                    ]}
                />
                <p className="mt-3 text-body-sm text-ds-muted-foreground">
                    Average time from request to finished repair: <span className="font-semibold text-ds-foreground">{formatDays(o.avgDaysToComplete)}</span>
                    {' '}(previous {period} days: {formatDays(o.previous.avgDaysToComplete)}). Success rate is finished ÷ (finished + cancelled). Turned away counts customers who couldn't submit because no local technician offers that repair.
                </p>
            </Section>

            <Section title="Requests over time" variant="card" actions={<TrendLegend />}>
                <Suspense fallback={<Skeleton className="h-[260px] w-full" />}>
                    <RequestsTrendChart data={data.daily} />
                </Suspense>
                <TrendTable daily={data.daily} />
            </Section>

            <Section
                title="Demand and technicians by region"
                description="Technicians can only be assigned in their own region. Waiting requests no technician in that region can take need a new technician there."
                variant="card"
                actions={unmatchedTotal > 0 ? <Badge tone="attention"><TriangleAlert aria-hidden="true" />{unmatchedTotal} waiting request{unmatchedTotal === 1 ? '' : 's'} can't be matched</Badge> : null}
            >
                <RegionTable regions={data.regions} />
            </Section>

            <Section title="Devices, repairs and pickup times" variant="card">
                <div className="grid gap-8 lg:grid-cols-2">
                    <BarList title="Top devices" rows={data.devices.map((d) => ({ key: d.productCategorySlug, label: labelSlug(d.productCategorySlug), value: d.requests }))} />
                    <BarList title="Top repairs" rows={data.repairs.map((r) => ({ key: r.repairCategorySlug, label: labelSlug(r.repairCategorySlug), value: r.requests }))} />
                </div>
                <div className="mt-8">
                    <h3 className="text-subhead text-ds-foreground">When pickups happen</h3>
                    <p className="mb-3 mt-0.5 text-body-sm text-ds-muted-foreground">Pickups booked for requests made in this period, by day and time. The stronger the colour, the busier the slot.</p>
                    <PickupGrid pickupLoad={data.pickupLoad} slots={data.slots} />
                </div>
            </Section>

            {data.inspectionFees && <InspectionFeeReport fees={data.inspectionFees} />}

            <Section title="Technician workload" variant="card">
                <KpiStrip
                    label="Technician workload"
                    items={[
                        { label: 'Approved technicians', value: formatCount(w.approved) },
                        { label: 'On a job now', value: formatCount(w.busy) },
                        { label: 'Free now', value: formatCount(w.free) },
                        { label: 'Never had a job', value: formatCount(w.neverAssigned) },
                    ]}
                />
                <h3 className="mb-2 mt-6 text-subhead text-ds-foreground">Most repairs finished</h3>
                <TopTechnicians rows={w.top} />
            </Section>
        </div>
    );
};

export default Reports;
