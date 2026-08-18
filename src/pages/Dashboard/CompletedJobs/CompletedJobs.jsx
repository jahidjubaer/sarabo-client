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
import TechnicianSettlementSummary from '../../../components/repair/TechnicianSettlementSummary';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { getProductSummary } from '../../../utils/customerRequestPresentation';

function CompletedJobItem({ request }) {
    const { device, category, brandModel } = getProductSummary(request);
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

                    <TechnicianSettlementSummary settlement={request.technicianSettlement} compact />
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

    const completedRepairsQuery = useQuery({
        queryKey: completedRepairsQueryKey,
        queryFn: async () => {
            const res = await axiosSecure.get(`/repair-requests/technician?deliveryStatus=repair_completed`);
            return res.data;
        },
    });

    const hasUsableRequests = Array.isArray(completedRepairsQuery.data);
    const requests = hasUsableRequests ? completedRepairsQuery.data : [];
    const isCompletedInitialLoading = completedRepairsQuery.isPending && !completedRepairsQuery.isPaused;
    const isCompletedUnavailableBeforeData = completedRepairsQuery.isPaused && !hasUsableRequests;
    const isCompletedErrorBeforeData = completedRepairsQuery.isError && !hasUsableRequests;
    const retryCompletedRepairs = () => queryClient.resetQueries({ queryKey: completedRepairsQueryKey });

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

    const description = requests.length === 0
        ? 'Your completed repair history will appear here.'
        : `${requests.length} completed repair${requests.length === 1 ? '' : 's'}`;

    return (
        <div className="space-y-6">
            <PageHeader eyebrow="Technician" title="Completed Repairs" description={description} />

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
