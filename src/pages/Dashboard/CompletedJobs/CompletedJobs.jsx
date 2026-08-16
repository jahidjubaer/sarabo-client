import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Loading from '../../../components/Loading/Loading';
import { ErrorState } from '../../../components/common/ErrorState';
import { formatMoney } from '../../../utils/currency';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';
import { humanizeSlug } from '../../../utils/serviceDefinitionCatalog';

// Technician Completed Repairs + earnings (Phase 8.11). A canonical V2 repair is
// completed when deliveryStatus === 'repair_completed' (set by the completion
// endpoint) - NOT the legacy courier 'parcel_delivered'. The server scopes rows
// to the caller's own technicianEmail and attaches a sanitized technicianEarning
// (labor-only, no commission; paidBy withheld). Financial totals come from the
// server-side earnings summary, never client aggregation. BDT throughout.
const EARNING_STATUS_LABEL = { pending: 'Pending', paid: 'Paid' };

function SummaryTile({ label, value }) {
    return (
        <div className="rounded-lg border border-base-300 p-4">
            <p className="text-xs uppercase tracking-wide opacity-60">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
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
        return <Loading></Loading>;
    }

    if (isCompletedErrorBeforeData || isCompletedUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <h2 className='text-4xl font-bold'>Completed Repairs</h2>
                <ErrorState
                    title="Couldn't load completed repairs"
                    description="We couldn't load your completed repairs right now. Please try again."
                    onRetry={retryCompletedRepairs}
                />
            </div>
        );
    }

    const currency = summary?.currency || 'bdt';

    return (
        <div className="space-y-6">
            <h2 className='text-4xl font-bold'>Completed Repairs: {requests.length}</h2>

            {isSummaryInitialLoading && (
                <div className="rounded-lg border border-base-300 p-4">
                    <p className="text-sm opacity-60">Loading earnings summary...</p>
                </div>
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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SummaryTile label="Total earned" value={formatMoney(summary.totalEarned, currency) || '—'} />
                    <SummaryTile label="Pending" value={formatMoney(summary.pendingAmount, currency) || '—'} />
                    <SummaryTile label="Paid" value={formatMoney(summary.paidAmount, currency) || '—'} />
                    <SummaryTile label="Completed repairs" value={summary.completedRepairCount ?? requests.length} />
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    {/* head */}
                    <thead>
                        <tr>
                            <th></th>
                            <th>Device</th>
                            <th>Service</th>
                            <th>Completed</th>
                            <th>Repair amount</th>
                            <th>Your earning</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request, index) => {
                            const earning = request.technicianEarning;
                            return (
                                <tr key={request._id}>
                                    <th>{index + 1}</th>
                                    <td>{request.deviceName || '—'}</td>
                                    <td>{request.product?.categorySlug ? humanizeSlug(request.product.categorySlug) : '—'}</td>
                                    <td>{request.updatedAt ? formatAbsoluteDateTime(request.updatedAt) : '—'}</td>
                                    <td>{formatMoney(request.quote?.totalAmount, request.quote?.currency) || '—'}</td>
                                    <td>{earning ? (formatMoney(earning.amount, earning.currency) || '—') : '—'}</td>
                                    <td>
                                        {earning
                                            ? <span className={`badge ${earning.status === 'paid' ? 'badge-success' : 'badge-ghost'}`}>{EARNING_STATUS_LABEL[earning.status] || earning.status}</span>
                                            : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {
                    requests.length === 0 && <p className='text-center py-8 opacity-60'>No completed repairs yet.</p>
                }
            </div>
        </div>
    );
};

export default CompletedJobs;
