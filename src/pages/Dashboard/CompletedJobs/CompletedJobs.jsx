import { PackageCheck } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { CardSkeleton } from '../../../components/common/Skeletons';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { JobRow } from '../../../components/technician/JobRow';
import { formatMoney } from '../../../utils/currency';

const SETTLEMENT_STATE = { pending: 'Pending receipt', available: 'In your balance' };

// What the job added to the wallet, in one line. Amounts are the server's own
// settlement snapshot, formatted only.
function EarningsLine({ settlement }) {
    if (!settlement) return <p className="text-micro text-ds-muted-foreground">No wallet settlement recorded for this earlier repair.</p>;
    return (
        <p className="flex flex-wrap items-baseline gap-x-2 text-body-sm">
            <span className="text-ds-muted-foreground">You receive</span>
            <span className="ds-numeric font-bold text-ds-success-subtle-foreground">{formatMoney(settlement.technicianReceivable, settlement.currency) || '—'}</span>
            <span className="text-micro text-ds-muted-foreground">{SETTLEMENT_STATE[settlement.status] || 'Recorded'}</span>
        </p>
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
                <PageHeader title="Completed jobs" />
                <div className="space-y-3">{[0, 1, 2].map((key) => <CardSkeleton key={key} className="h-24" />)}</div>
            </div>
        );
    }

    if (isCompletedErrorBeforeData || isCompletedUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader title="Completed jobs" />
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
        : `${requests.length} completed job${requests.length === 1 ? '' : 's'}, newest first`;
    const sorted = [...requests].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    return (
        <div className="space-y-6">
            <PageHeader title="Completed jobs" description={description} />

            {requests.length === 0 ? (
                <EmptyState
                    icon={PackageCheck}
                    title="No completed jobs yet"
                    description="Jobs you finish will be listed here with what each one earned."
                />
            ) : (
                <section aria-labelledby="completed-job-history-heading">
                    <h2 id="completed-job-history-heading" className="sr-only">Completed repair jobs</h2>
                    <ul className="space-y-3">
                        {sorted.map((request) => (
                            <li key={request._id}>
                                <JobRow job={request}>
                                    <EarningsLine settlement={request.technicianSettlement} />
                                </JobRow>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

export default CompletedJobs;
