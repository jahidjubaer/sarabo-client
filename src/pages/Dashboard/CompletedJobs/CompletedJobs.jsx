import { Link } from 'react-router';
import { CalendarDays, ChevronRight, Hash, PackageCheck } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Loading from '../../../components/Loading/Loading';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatMoney } from '../../../utils/currency';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { getProductSummary } from '../../../utils/customerRequestPresentation';

// Technician Completed Repairs + earnings. Phase 10 composed the operational
// history cards below; Phase 12 redesigns ONLY the earnings summary block at
// the top - the job cards, their hierarchy, statuses, navigation, queries and
// responsive structure are untouched.
const EARNING_STATUS_LABEL = { pending: 'Pending', paid: 'Paid' };

// One authoritative figure with its accounting breakdown, deliberately not four
// equal KPI tiles: this is an accounting note on a job-history page, not a
// payout dashboard. Every value comes straight from the server's
// earnings-summary response (totalEarned / paidAmount / pendingAmount /
// completedRepairCount, currency bdt) - nothing is summed, derived, projected
// or commissioned on the client.
function EarningFact({ label, value }) {
    return (
        <div className="min-w-0">
            <dt className="text-micro text-ds-muted-foreground">{label}</dt>
            <dd className="ds-numeric mt-1 min-w-0 break-all text-subhead text-ds-foreground">{value}</dd>
        </div>
    );
}

function CompletedJobItem({ request }) {
    const { device, category, brandModel } = getProductSummary(request);
    const earning = request.technicianEarning;
    const headingId = `completed-job-${request._id}`;

    return (
        <Card className="overflow-hidden">
            <article aria-labelledby={headingId}>
                <div className="space-y-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                            <StatusBadge status={request.deliveryStatus} />
                            <div>
                                <h3 id={headingId} className="break-words text-base font-semibold text-ds-foreground">{device}</h3>
                                {(category || brandModel) && (
                                    <p className="mt-0.5 break-words text-sm text-ds-muted-foreground">
                                        {[category, brandModel].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                            </div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-ds-muted-foreground">
                            <CalendarDays aria-hidden="true" className="size-3.5" />
                            {request.updatedAt ? formatAbsoluteDateTime(request.updatedAt) : 'Completion time unavailable'}
                        </span>
                    </div>

                    {request.trackingId && (
                        <p className="flex min-w-0 items-start gap-1.5 font-mono text-xs text-ds-muted-foreground">
                            <Hash aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                            <span className="break-all">{request.trackingId}</span>
                        </p>
                    )}

                    <dl className="grid gap-3 border-t border-ds-border pt-4 text-sm sm:grid-cols-3">
                        <div>
                            <dt className="text-xs text-ds-muted-foreground">Repair amount</dt>
                            <dd className="mt-0.5 font-medium tabular-nums text-ds-foreground">
                                {formatMoney(request.quote?.totalAmount, request.quote?.currency) || '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-ds-muted-foreground">Your earning</dt>
                            <dd className="mt-0.5 font-medium tabular-nums text-ds-foreground">
                                {earning ? (formatMoney(earning.amount, earning.currency) || '—') : '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-ds-muted-foreground">Earning status</dt>
                            <dd className="mt-1">
                                {earning
                                    ? <Badge tone={earning.status === 'paid' ? 'success' : 'neutral'}>{EARNING_STATUS_LABEL[earning.status] || earning.status}</Badge>
                                    : '—'}
                            </dd>
                        </div>
                    </dl>
                </div>

                <Link
                    to={`/dashboard/assigned-jobs/${request._id}`}
                    aria-label={`View completed job — ${[device, request.trackingId].filter(Boolean).join(' · ')}`}
                    className="focus-ring flex items-center justify-between gap-3 border-t border-ds-border bg-ds-muted/20 px-4 py-3 text-sm font-medium text-ds-primary hover:bg-ds-muted/50 sm:px-5"
                >
                    View completed job
                    <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
                </Link>
            </article>
        </Card>
    );
}

const CompletedJobs = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const completedRepairsQueryKey = ['completedRepairs', user?.email];
    const earningsSummaryQueryKey = ['technicianEarningsSummary', user?.email];

    const completedRepairsQuery = useQuery({
        queryKey: completedRepairsQueryKey,
        queryFn: async () => {
            const res = await axiosSecure.get(`/repair-requests/technician?deliveryStatus=repair_completed`);
            return res.data;
        },
    });

    // Server-authoritative earnings totals (never summed on the client).
    const earningsSummaryQuery = useQuery({
        queryKey: earningsSummaryQueryKey,
        queryFn: async () => (await axiosSecure.get('/repair-requests/technician/earnings-summary')).data,
    });

    const hasUsableRequests = Array.isArray(completedRepairsQuery.data);
    const requests = hasUsableRequests ? completedRepairsQuery.data : [];
    const isCompletedInitialLoading = completedRepairsQuery.isPending && !completedRepairsQuery.isPaused;
    const isCompletedUnavailableBeforeData = completedRepairsQuery.isPaused && !hasUsableRequests;
    const isCompletedErrorBeforeData = completedRepairsQuery.isError && !hasUsableRequests;
    const retryCompletedRepairs = () => queryClient.resetQueries({ queryKey: completedRepairsQueryKey });

    const hasUsableSummary = earningsSummaryQuery.data !== undefined;
    const summary = earningsSummaryQuery.data;
    const isSummaryInitialLoading = earningsSummaryQuery.isPending && !earningsSummaryQuery.isPaused;
    const isSummaryUnavailableBeforeData = earningsSummaryQuery.isPaused && !hasUsableSummary;
    const isSummaryErrorBeforeData = earningsSummaryQuery.isError && !hasUsableSummary;
    const retryEarningsSummary = () => queryClient.resetQueries({ queryKey: earningsSummaryQueryKey });

    if (isCompletedInitialLoading) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Technician" title="Completed Repairs" />
                <Loading />
            </div>
        );
    }

    if (isCompletedErrorBeforeData || isCompletedUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Technician" title="Completed Repairs" />
                <ErrorState
                    title="Couldn't load completed repairs"
                    description="We couldn't load your completed repairs right now. Please try again."
                    onRetry={retryCompletedRepairs}
                />
            </div>
        );
    }

    const currency = summary?.currency || 'bdt';
    const description = requests.length === 0
        ? 'Your completed repair history will appear here.'
        : `${requests.length} completed repair${requests.length === 1 ? '' : 's'}`;

    return (
        <div className="space-y-6">
            <PageHeader eyebrow="Technician" title="Completed Repairs" description={description} />

            {isSummaryInitialLoading && (
                <Card className="space-y-3 p-5" role="status" aria-label="Loading earnings summary">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-3 w-full max-w-xs" />
                </Card>
            )}

            {(isSummaryErrorBeforeData || isSummaryUnavailableBeforeData) && (
                <ErrorState
                    title="Couldn't load earnings summary"
                    description="Your earnings summary is unavailable right now. Please try again."
                    onRetry={retryEarningsSummary}
                    className="py-6"
                />
            )}

            {hasUsableSummary && summary && (
                <Card className="p-5" aria-labelledby="earnings-summary-heading">
                    <h2 id="earnings-summary-heading" className="ds-label text-ds-muted-foreground">Earnings summary</h2>
                    <p className="ds-numeric mt-2 min-w-0 break-all text-title text-ds-foreground">
                        {formatMoney(summary.totalEarned, currency) || '—'}
                    </p>
                    <p className="mt-1 text-body-sm text-ds-muted-foreground">
                        Total labour earning recorded across your completed repairs. Parts and other charges are not included.
                    </p>

                    <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-ds-border pt-4 sm:grid-cols-3">
                        <EarningFact label="Paid" value={formatMoney(summary.paidAmount, currency) || '—'} />
                        <EarningFact label="Pending" value={formatMoney(summary.pendingAmount, currency) || '—'} />
                        <EarningFact label="Completed repairs" value={summary.completedRepairCount ?? requests.length} />
                    </dl>
                </Card>
            )}

            <section aria-labelledby="completed-job-history-heading" className="space-y-3">
                <div>
                    <p className="ds-label text-ds-primary">Operational history</p>
                    <h2 id="completed-job-history-heading" className="mt-1 text-xl font-semibold tracking-tight text-ds-foreground">Completed repair jobs</h2>
                </div>

                {requests.length === 0 ? (
                    <EmptyState
                        icon={PackageCheck}
                        title="No completed repairs yet"
                        description="Completed repair work will appear here."
                        className="py-12"
                        headingLevel={3}
                    />
                ) : (
                    <ul className="grid gap-3 xl:grid-cols-2">
                        {requests.map((request) => (
                            <li key={request._id}>
                                <CompletedJobItem request={request} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default CompletedJobs;
