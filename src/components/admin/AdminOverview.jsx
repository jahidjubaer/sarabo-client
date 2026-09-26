import { lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion as Motion, MotionConfig } from 'motion/react';
import { ArrowRight, Banknote, CalendarX, CircleCheckBig, Clock3, Flag, MapPinOff, ReceiptText, TriangleAlert, Undo2, UserCheck, UserCog } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { walletKeys } from '../../hooks/walletKeys';
import { useAdminFeedbackList } from '../../hooks/useTechnicianFeedback';
import { useAdminAttention } from '../../hooks/useAdminAttention';
import { attentionIdSets, flagsFor, attentionDeviceLabel, ATTENTION_FLAGS } from '../../utils/attentionPresentation';
import { formatPickupSlot } from '../../utils/pickupSlots';
import { PageHeader } from '../common/PageHeader';
import { ErrorState } from '../common/ErrorState';
import { CardSkeleton } from '../common/Skeletons';
import { Skeleton } from '../ui/skeleton';
import { Section } from '../common/Section';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { buttonVariants } from '../ui/button-variants';
import {
    summarizeStatusStats, statusChartData, categoryChartData, groupPaymentsByCurrency, summarizeTechnicians,
} from '../../utils/adminPresentation';
import { getProductSummary } from '../../utils/customerRequestPresentation';
import { REPORT_REASONS } from '../../utils/technicianFeedback';
import { formatMoney } from '../../utils/currency';
import { formatRelativeTime } from '../../utils/relativeTime';
import { staggerContainer, staggerItem } from '../../theme/motion';
import { cn } from '../../lib/utils';

const QUEUE_LIMIT = 6;
const OVERVIEW_PEEK = { page: 1, limit: 5 };

// recharts is most of this page's download, so the charts load separately
// and the rest of the overview does not wait for them.
const RequestBarChart = lazy(() => import('./RequestBarChart'));

function LazyBarChart({ data, labelWidth }) {
    const height = Math.max(data.length * 40, 200);
    return (
        <Suspense fallback={<Skeleton className="w-full" style={{ height }} />}>
            <RequestBarChart data={data} labelWidth={labelWidth} height={height} />
        </Suspense>
    );
}

function ChartEmpty({ message }) {
    return <p className="py-10 text-center text-sm text-ds-muted-foreground">{message}</p>;
}

function getArraySourceState(query) {
    const hasUsableData = Array.isArray(query.data);
    return {
        hasUsableData,
        isInitialLoading: query.isPending && !query.isPaused && !hasUsableData,
        isUnavailableBeforeData: !hasUsableData && (query.isPaused || query.isError),
    };
}

function SourceUnavailable({ title, description, onRetry, className }) {
    return <ErrorState title={title} description={description} onRetry={onRetry} className={className} />;
}

// One queue count. Each tile is a link into its list, already filtered to
// what needs doing. A count that has not loaded shows a dash, never a false 0.
function QueueTile({ to, icon, label, count }) {
    const TileIcon = icon;
    const waiting = typeof count === 'number' && count > 0;
    return (
        <Link
            to={to}
            className={cn(
                'focus-ring flex min-w-0 items-center gap-3 rounded-ds-lg border bg-ds-card p-4 transition-colors hover:bg-ds-muted/60',
                waiting ? 'border-ds-border border-l-4 border-l-ds-action' : 'border-ds-border'
            )}
        >
            <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-ds-lg', waiting ? 'bg-ds-attention-subtle text-ds-attention-subtle-foreground' : 'bg-ds-muted text-ds-muted-foreground')}>
                <TileIcon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0">
                <span className="ds-numeric block text-heading leading-tight text-ds-foreground">{typeof count === 'number' ? count : '—'}</span>
                <span className="block text-micro font-semibold text-ds-muted-foreground">{label}</span>
            </span>
        </Link>
    );
}

// Pickups that are late or can't be matched, each linking to the list that
// fixes it. Hidden when nothing is wrong.
function AttentionStrip({ counts }) {
    const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
    const items = [
        counts.missedPickups > 0 && { key: 'missed', icon: CalendarX, text: `${plural(counts.missedPickups, 'pickup')} missed`, hint: 'Technician assigned, device not collected', to: '#needs-you-queue' },
        counts.overdueWaiting > 0 && { key: 'overdue', icon: TriangleAlert, text: `${plural(counts.overdueWaiting, 'pickup')} overdue`, hint: 'Pickup time passed, no technician yet', to: '/dashboard/assign-technicians?view=overdue' },
        counts.unchosen > 0 && { key: 'unchosen', icon: Clock3, text: `${plural(counts.unchosen, 'request')} with nobody chosen`, hint: 'Open 24 hours in the job portal - invite a technician', to: '/dashboard/assign-technicians?view=unchosen' },
        counts.feeRefunds > 0 && { key: 'refunds', icon: Undo2, text: `${plural(counts.feeRefunds, 'refund')} waiting`, hint: 'Inspection fees Stripe has not refunded yet - retry them', to: '#needs-you-queue' },
        counts.unmatchable > 0 && { key: 'unmatched', icon: MapPinOff, text: `${plural(counts.unmatchable, 'request')} with no local technician`, hint: 'Nobody in the region can take them', to: '/dashboard/assign-technicians?view=unmatched' },
    ].filter(Boolean);
    if (items.length === 0) return null;
    return (
        <nav aria-label="Pickups that need attention" className="mb-5 grid gap-3 rounded-ds-lg border border-ds-attention/40 bg-ds-attention-subtle p-3 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => {
                const ItemIcon = item.icon;
                const content = (
                    <>
                        <ItemIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-attention-subtle-foreground" />
                        <span className="min-w-0">
                            <span className="block text-body-sm font-bold text-ds-foreground">{item.text}</span>
                            <span className="block text-micro text-ds-attention-subtle-foreground">{item.hint}</span>
                        </span>
                    </>
                );
                const className = 'focus-ring flex min-h-11 items-start gap-2 rounded-ds p-2 hover:bg-ds-card/60';
                return item.to.startsWith('#')
                    ? <a key={item.key} href={item.to} className={className}>{content}</a>
                    : <Link key={item.key} to={item.to} className={className}>{content}</Link>;
            })}
        </nav>
    );
}

// One item in the combined queue: what it is, the one thing to do, and how
// long it has been waiting.
function QueueRow({ item, featured }) {
    const ItemIcon = item.icon;
    return (
        <li className="flex flex-col gap-3 border-t border-ds-border py-4 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
            <span className="hidden size-10 shrink-0 items-center justify-center rounded-ds-lg bg-ds-muted text-ds-foreground sm:flex">
                <ItemIcon aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
                <p className={cn('text-micro font-semibold', item.urgent ? 'text-ds-attention-subtle-foreground' : 'text-ds-muted-foreground')}>{item.kind}</p>
                <p className="break-words text-body-sm font-bold text-ds-foreground">{item.title}</p>
                <p className="flex flex-wrap gap-x-3 text-micro text-ds-muted-foreground">
                    {item.meta.filter(Boolean).map((part) => <span key={part}>{part}</span>)}
                    {item.at && <span>{item.atLabel || 'Waiting since'} {formatRelativeTime(item.at)}</span>}
                </p>
            </div>
            <Link
                to={item.to}
                aria-label={`${item.action}: ${item.title}`}
                className={cn(buttonVariants({ variant: featured ? 'action' : 'outline', size: 'sm' }), 'w-full shrink-0 sm:w-auto')}
            >
                {item.action} <ArrowRight aria-hidden="true" />
            </Link>
        </li>
    );
}

// Kind line for a waiting request, most serious reason first.
function requestKind(flags) {
    if (flags.includes('overdue') && flags.includes('unmatched')) return 'Pickup time passed · no local technician';
    if (flags.includes('overdue')) return ATTENTION_FLAGS.overdue.label;
    if (flags.includes('unmatched')) return ATTENTION_FLAGS.unmatched.label;
    return 'Needs a technician';
}

const REFUND_REASONS = {
    booking_failed: 'Technician could not be booked',
    technician_no_show: 'Technician did not come',
    customer_cancelled: 'Customer cancelled in time',
};

function buildQueue({ requests, technicians, withdrawals, reports, attention }) {
    const sets = attention ? attentionIdSets(attention) : null;
    const items = [
        // A technician was assigned but the device was not collected in its window.
        ...(attention?.missedPickups ?? []).map((entry) => ({
            key: `missed-${entry.id}`, icon: CalendarX, kind: 'Pickup missed', title: attentionDeviceLabel(entry), urgent: true, priority: 3,
            meta: [entry.technicianName && `Technician: ${entry.technicianName}`, entry.district, formatPickupSlot(entry.pickupSlot), entry.trackingId],
            at: entry.pickupSlot?.endsAt, atLabel: 'Window ended', action: 'Open', to: `/dashboard/manage-repair-requests/${entry.id}`,
        })),
        // An inspection-fee refund Stripe has not completed (job-portal phase D).
        ...(attention?.feeRefunds ?? []).map((entry) => ({
            key: `refund-${entry.id}-${entry.paidAt}`, icon: Undo2, kind: 'Refund waiting', title: `${formatMoney(entry.amount, entry.currency)} inspection fee`, urgent: true, priority: 3,
            meta: [REFUND_REASONS[entry.reason], entry.trackingId],
            at: entry.paidAt, atLabel: 'Paid', action: 'Retry refund', to: `/dashboard/manage-repair-requests/${entry.id}`,
        })),
        ...requests.map((request) => {
            const { device, category } = getProductSummary(request);
            const flags = flagsFor(request._id, sets);
            return {
                key: `request-${request._id}`, icon: flags.includes('unmatched') ? MapPinOff : UserCog, kind: requestKind(flags), title: device,
                urgent: flags.length > 0,
                priority: flags.includes('overdue') ? 2 : flags.includes('unmatched') ? 1 : 0,
                meta: [category, request.senderDistrict || request.serviceLocation?.district, formatPickupSlot(request.pickupSlot), request.trackingId],
                at: request.createdAt, action: 'Assign', to: `/dashboard/assign-technicians?request=${request._id}`,
            };
        }),
        ...technicians.map((technician) => ({
            key: `application-${technician._id}`, icon: UserCheck, kind: 'Technician application', title: technician.name || 'Technician applicant',
            meta: [technician.email, technician.district],
            at: technician.createdAt, action: 'Review', to: `/dashboard/approve-technicians?status=pending&q=${encodeURIComponent(technician.email || '')}`,
        })),
        ...withdrawals.map((withdrawal) => ({
            key: `withdrawal-${withdrawal.id}`, icon: Banknote, kind: 'Withdrawal request', title: `${formatMoney(withdrawal.amount, withdrawal.currency)} to ${withdrawal.technicianName || withdrawal.technicianEmail || 'a technician'}`,
            meta: [withdrawal.technicianEmail],
            at: withdrawal.requestedAt, action: 'Process', to: '/dashboard/withdrawal-requests',
        })),
        ...reports.map((report) => ({
            key: `report-${report._id}`, icon: Flag, kind: 'Report about a technician', title: REPORT_REASONS[report.reason] || 'Report',
            meta: [],
            at: report.createdAt, action: 'Open', to: '/dashboard/technician-reports?status=open',
        })),
    ];
    // Most urgent first - missed pickups, then overdue pickups, then requests
    // no local technician can take - and oldest first within each.
    return items.sort((a, b) => ((b.priority || 0) - (a.priority || 0)) || (new Date(a.at || 0) - new Date(b.at || 0)));
}

// Admin home (Phase 5): what needs an admin, then the workload, then the
// supporting numbers.
//
//   Needs you   four counts (each links to its list, pre-filtered) and one
//               combined queue, oldest first, with one action per item
//   Workload    request and technician counts
//   Reports     payments per currency and the two distribution charts
//
// Every figure comes from an existing admin read; nothing is computed that
// the server does not already provide, and a source that fails says so
// instead of showing zero.
function AdminOverview() {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();

    const statusStatsQueryKey = ['request-status-stats'];
    const allRequestsQueryKey = ['admin-all-requests'];
    const allTechniciansQueryKey = ['admin-all-technicians'];
    const allPaymentsQueryKey = ['admin-all-payments'];
    const withdrawalPeekKey = [...walletKeys.adminAll, 'overview', 'requested'];

    const statsQuery = useQuery({ queryKey: statusStatsQueryKey, queryFn: async () => (await axiosSecure.get('/repair-requests/delivery-status/stats')).data });
    const requestsQuery = useQuery({ queryKey: allRequestsQueryKey, queryFn: async () => (await axiosSecure.get('/repair-requests')).data });
    const techniciansQuery = useQuery({ queryKey: allTechniciansQueryKey, queryFn: async () => (await axiosSecure.get('/technicians')).data });
    const paymentsQuery = useQuery({ queryKey: allPaymentsQueryKey, queryFn: async () => (await axiosSecure.get('/payments')).data });
    const withdrawalsQuery = useQuery({
        queryKey: withdrawalPeekKey,
        queryFn: async () => (await axiosSecure.get('/admin/withdrawals', { params: { status: 'requested', ...OVERVIEW_PEEK } })).data,
    });
    const reportsQuery = useAdminFeedbackList('reports', { ...OVERVIEW_PEEK, status: 'open' });
    // Optional: if it fails, the queue simply has no attention flags.
    const attentionQuery = useAdminAttention();

    const statsState = getArraySourceState(statsQuery);
    const requestsState = getArraySourceState(requestsQuery);
    const techniciansState = getArraySourceState(techniciansQuery);
    const paymentsState = getArraySourceState(paymentsQuery);
    const withdrawalsReady = Array.isArray(withdrawalsQuery.data?.withdrawals);
    const reportsReady = Array.isArray(reportsQuery.data?.items);

    const summary = statsState.hasUsableData ? summarizeStatusStats(statsQuery.data) : null;
    const technicianSummary = techniciansState.hasUsableData ? summarizeTechnicians(techniciansQuery.data) : null;
    const statusData = statsState.hasUsableData ? statusChartData(statsQuery.data) : null;
    const categoryData = requestsState.hasUsableData ? categoryChartData(requestsQuery.data) : null;
    const paymentGroups = paymentsState.hasUsableData ? groupPaymentsByCurrency(paymentsQuery.data) : null;
    const paymentCount = paymentsState.hasUsableData ? paymentsQuery.data.length : null;

    const awaiting = requestsState.hasUsableData ? requestsQuery.data.filter((request) => request.deliveryStatus === 'pending-pickup') : [];
    const applications = techniciansState.hasUsableData ? techniciansQuery.data.filter((technician) => technician.status === 'pending') : [];
    const withdrawals = withdrawalsReady ? withdrawalsQuery.data.withdrawals : [];
    const reports = reportsReady ? reportsQuery.data.items : [];

    const counts = {
        awaiting: requestsState.hasUsableData ? awaiting.length : null,
        applications: techniciansState.hasUsableData ? applications.length : null,
        withdrawals: withdrawalsReady ? withdrawalsQuery.data.total ?? withdrawals.length : null,
        reports: reportsReady ? reportsQuery.data.total ?? reports.length : null,
    };
    const queue = buildQueue({ requests: awaiting, technicians: applications, withdrawals, reports, attention: attentionQuery.data });
    const knownCounts = Object.values(counts).filter((value) => typeof value === 'number');
    const totalWaiting = knownCounts.reduce((sum, value) => sum + value, 0);
    const allCountsKnown = knownCounts.length === 4;
    const queueLoading = requestsState.isInitialLoading || techniciansState.isInitialLoading || withdrawalsQuery.isPending || reportsQuery.isPending;
    const failedSources = [
        requestsState.isUnavailableBeforeData && { label: 'repair requests', retry: () => queryClient.resetQueries({ queryKey: allRequestsQueryKey }) },
        techniciansState.isUnavailableBeforeData && { label: 'technician applications', retry: () => queryClient.resetQueries({ queryKey: allTechniciansQueryKey }) },
        !withdrawalsReady && (withdrawalsQuery.isError || withdrawalsQuery.isPaused) && { label: 'withdrawals', retry: () => queryClient.resetQueries({ queryKey: withdrawalPeekKey }) },
        !reportsReady && (reportsQuery.isError || reportsQuery.isPaused) && { label: 'reports', retry: () => queryClient.resetQueries({ queryKey: reportsQuery.queryKey, exact: true }) },
    ].filter(Boolean);

    const resetQuery = (queryKey) => queryClient.resetQueries({ queryKey });

    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-8">
                <PageHeader
                    title="Operations"
                    description={allCountsKnown
                        ? totalWaiting > 0 ? `${totalWaiting} item${totalWaiting === 1 ? '' : 's'} need${totalWaiting === 1 ? 's' : ''} you.` : 'Nothing needs you right now.'
                        : 'What needs you first, then the workload.'}
                />

                <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-10">
                    <Motion.div variants={staggerItem}>
                        <Section title="Needs you" description="Most urgent first, then oldest. Each count opens its list, already filtered.">
                            {attentionQuery.data?.counts && <AttentionStrip counts={attentionQuery.data.counts} />}
                            <nav aria-label="Queues" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <QueueTile to="/dashboard/assign-technicians" icon={UserCog} label="Need a technician" count={counts.awaiting} />
                                <QueueTile to="/dashboard/approve-technicians?status=pending" icon={UserCheck} label="Applications to review" count={counts.applications} />
                                <QueueTile to="/dashboard/withdrawal-requests" icon={Banknote} label="Withdrawals to process" count={counts.withdrawals} />
                                <QueueTile to="/dashboard/technician-reports?status=open" icon={Flag} label="Open reports" count={counts.reports} />
                            </nav>

                            {failedSources.length > 0 && (
                                <div role="alert" className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-ds-lg border border-ds-border bg-ds-muted p-3 text-body-sm">
                                    <span className="min-w-0 flex-1">Couldn't load {failedSources.map((source) => source.label).join(', ')}. The queue below may be incomplete.</span>
                                    <button type="button" onClick={() => failedSources.forEach((source) => source.retry())} className="focus-ring min-h-11 rounded-ds px-2 font-semibold text-ds-primary hover:underline">Try again</button>
                                </div>
                            )}

                            <div id="needs-you-queue" className="scroll-mt-24 rounded-ds-lg border border-ds-border bg-ds-card p-4 sm:p-5">
                                {queueLoading && queue.length === 0 ? (
                                    <div className="space-y-3">{[0, 1, 2].map((key) => <CardSkeleton key={key} className="h-16" />)}</div>
                                ) : queue.length === 0 ? (
                                    <p className="flex items-center gap-3 text-body-sm text-ds-muted-foreground">
                                        <CircleCheckBig aria-hidden="true" className="size-5 shrink-0 text-ds-success" />
                                        {failedSources.length > 0 ? 'Nothing waiting in the lists that loaded.' : 'Nothing is waiting. New requests, applications, withdrawals and reports will appear here.'}
                                    </p>
                                ) : (
                                    <>
                                        <ul>{queue.slice(0, QUEUE_LIMIT).map((item, index) => <QueueRow key={item.key} item={item} featured={index === 0} />)}</ul>
                                        {queue.length > QUEUE_LIMIT && (
                                            <p className="mt-4 border-t border-ds-border pt-3 text-micro text-ds-muted-foreground">
                                                Showing {QUEUE_LIMIT}: urgent pickups first, then the oldest. Use the counts above to see each full list.
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </Section>
                    </Motion.div>

                    <Motion.div variants={staggerItem}>
                        <Section title="Workload">
                            {statsState.isUnavailableBeforeData && techniciansState.isUnavailableBeforeData ? (
                                <SourceUnavailable title="Workload unavailable" description="We couldn't load request and technician counts right now." onRetry={() => { resetQuery(statusStatsQueryKey); resetQuery(allTechniciansQueryKey); }} />
                            ) : (
                                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-ds-lg border border-ds-border bg-ds-border lg:grid-cols-4">
                                    {[
                                        { label: 'Requests', value: summary?.total, to: '/dashboard/manage-repair-requests' },
                                        { label: 'In progress', value: summary?.active },
                                        { label: 'Completed', value: summary?.completed },
                                        { label: 'Technicians available', value: technicianSummary ? `${technicianSummary.available} of ${technicianSummary.approved}` : undefined, to: '/dashboard/approve-technicians?status=approved' },
                                    ].map((metric) => (
                                        <div key={metric.label} className="bg-ds-card px-5 py-4">
                                            <dt className="text-micro font-semibold text-ds-muted-foreground">{metric.label}</dt>
                                            <dd className="ds-numeric mt-0.5 text-heading text-ds-foreground">
                                                {metric.value === undefined || metric.value === null ? '—' : metric.to
                                                    ? <Link to={metric.to} className="focus-ring rounded-ds-sm hover:text-ds-primary">{metric.value}</Link>
                                                    : metric.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            )}
                        </Section>
                    </Motion.div>

                    <Motion.section variants={staggerItem} aria-labelledby="admin-payment-context-heading" className="space-y-4">
                        <h2 id="admin-payment-context-heading" className="text-heading text-ds-foreground">Payments</h2>
                        {paymentsState.isInitialLoading ? (
                            <CardSkeleton />
                        ) : paymentsState.isUnavailableBeforeData ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <SourceUnavailable
                                        title="Payment summary unavailable"
                                        description="We couldn't load payment summary data right now."
                                        onRetry={() => resetQuery(allPaymentsQueryKey)}
                                        className="py-8"
                                    />
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ReceiptText aria-hidden="true" className="size-4 text-ds-muted-foreground" />
                                        Payments recorded: {paymentCount}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {paymentGroups.length === 0 ? (
                                        <p className="text-sm text-ds-muted-foreground">No payments recorded yet.</p>
                                    ) : (
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                            {paymentGroups.map((group) => (
                                                <div key={group.currency} className="rounded-ds border border-ds-border p-3">
                                                    <p className="text-xs uppercase tracking-wide text-ds-muted-foreground">{group.currency} · {group.count} payment{group.count === 1 ? '' : 's'}</p>
                                                    <p className="mt-1 text-lg font-semibold tabular-nums text-ds-foreground">{group.formattedTotal}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="mt-3 text-xs text-ds-muted-foreground">Totals are shown separately per currency and are never combined.</p>
                                </CardContent>
                            </Card>
                        )}
                    </Motion.section>

                    <Motion.section variants={staggerItem} aria-labelledby="admin-analytics-heading" className="space-y-4">
                        <div className="space-y-0.5">
                            <h2 id="admin-analytics-heading" className="text-heading text-ds-foreground">Requests at a glance</h2>
                            <p className="text-body-sm text-ds-muted-foreground">Every request, grouped by status and by device category.</p>
                        </div>
                        <div className="grid gap-6 lg:grid-cols-2">
                            {statsState.isInitialLoading ? (
                                <CardSkeleton className="h-72" />
                            ) : statsState.isUnavailableBeforeData ? (
                                <Card>
                                    <CardHeader><CardTitle>Requests by status</CardTitle></CardHeader>
                                    <CardContent>
                                        <SourceUnavailable
                                            title="Status chart unavailable"
                                            description="We couldn't load request status data right now."
                                            onRetry={() => resetQuery(statusStatsQueryKey)}
                                            className="py-8"
                                        />
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader><CardTitle>Requests by status</CardTitle></CardHeader>
                                    <CardContent>
                                        {statusData.length === 0 ? (
                                            <ChartEmpty message="No repair requests yet." />
                                        ) : (
                                            <LazyBarChart data={statusData} labelWidth={150} />
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {requestsState.isInitialLoading ? (
                                <CardSkeleton className="h-72" />
                            ) : requestsState.isUnavailableBeforeData ? (
                                <Card>
                                    <CardHeader><CardTitle>Requests by device category</CardTitle></CardHeader>
                                    <CardContent>
                                        <SourceUnavailable
                                            title="Device categories unavailable"
                                            description="We couldn't load request category data right now."
                                            onRetry={() => resetQuery(allRequestsQueryKey)}
                                            className="py-8"
                                        />
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader><CardTitle>Requests by device category</CardTitle></CardHeader>
                                    <CardContent>
                                        {categoryData.length === 0 ? (
                                            <ChartEmpty message="No categorised requests yet." />
                                        ) : (
                                            <LazyBarChart data={categoryData} labelWidth={140} />
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </Motion.section>
                </Motion.div>
            </div>
        </MotionConfig>
    );
}

export default AdminOverview;
