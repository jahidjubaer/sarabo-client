import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion as Motion, MotionConfig } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { ClipboardList, UserPlus, Wrench, CheckCheck, Users, ReceiptText } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { ErrorState } from '../common/ErrorState';
import { CardSkeleton } from '../common/Skeletons';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltipContent } from '../ui/chart';
import {
    summarizeStatusStats, statusChartData, categoryChartData, groupPaymentsByCurrency, summarizeTechnicians,
} from '../../utils/adminPresentation';
import { staggerContainer, staggerItem } from '../../theme/motion';

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

// Admin operations dashboard (Phase 7.5): authoritative, count-based metrics +
// two operationally-useful charts + a CURRENCY-SAFE payment summary (never a
// mixed-currency total). Reuses the existing admin queries; no new endpoints,
// no fabricated metrics (removed the mixed-currency "Revenue" figure).
function AdminOverview() {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();

    const statusStatsQueryKey = ['request-status-stats'];
    const allRequestsQueryKey = ['admin-all-requests'];
    const allTechniciansQueryKey = ['admin-all-technicians'];
    const allPaymentsQueryKey = ['admin-all-payments'];

    const statsQuery = useQuery({ queryKey: statusStatsQueryKey, queryFn: async () => (await axiosSecure.get('/repair-requests/delivery-status/stats')).data });
    const requestsQuery = useQuery({ queryKey: allRequestsQueryKey, queryFn: async () => (await axiosSecure.get('/repair-requests')).data });
    const techniciansQuery = useQuery({ queryKey: allTechniciansQueryKey, queryFn: async () => (await axiosSecure.get('/technicians')).data });
    const paymentsQuery = useQuery({ queryKey: allPaymentsQueryKey, queryFn: async () => (await axiosSecure.get('/payments')).data });

    const statsState = getArraySourceState(statsQuery);
    const requestsState = getArraySourceState(requestsQuery);
    const techniciansState = getArraySourceState(techniciansQuery);
    const paymentsState = getArraySourceState(paymentsQuery);

    const summary = statsState.hasUsableData ? summarizeStatusStats(statsQuery.data) : null;
    const technicians = techniciansState.hasUsableData ? summarizeTechnicians(techniciansQuery.data) : null;
    const statusData = statsState.hasUsableData ? statusChartData(statsQuery.data) : null;
    const categoryData = requestsState.hasUsableData ? categoryChartData(requestsQuery.data) : null;
    const paymentGroups = paymentsState.hasUsableData ? groupPaymentsByCurrency(paymentsQuery.data) : null;
    const paymentCount = paymentsState.hasUsableData ? paymentsQuery.data.length : null;

    const resetQuery = (queryKey) => queryClient.resetQueries({ queryKey });

    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-6">
                <PageHeader eyebrow="Admin" title="Operations Dashboard" description="A live view of repair requests, technicians, and payments across Sarabo." />

                <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
                    <Motion.div variants={staggerItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {statsState.isInitialLoading ? (
                            [0, 1, 2, 3].map((key) => <CardSkeleton key={key} />)
                        ) : statsState.isUnavailableBeforeData ? (
                            <SourceUnavailable
                                title="Request status unavailable"
                                description="We couldn't load request status counts right now. Please try again."
                                onRetry={() => resetQuery(statusStatsQueryKey)}
                                className="sm:col-span-2 lg:col-span-3 xl:col-span-4"
                            />
                        ) : (
                            <>
                                <StatCard label="Total requests" value={summary.total} icon={ClipboardList} />
                                <StatCard label="Awaiting assignment" value={summary.awaitingAssignment} icon={UserPlus} helper={summary.awaitingAssignment > 0 ? 'Needs action' : undefined} trend={summary.awaitingAssignment > 0 ? 'down' : undefined} />
                                <StatCard label="Active repairs" value={summary.active} icon={Wrench} />
                                <StatCard label="Completed" value={summary.completed} icon={CheckCheck} />
                            </>
                        )}

                        {techniciansState.isInitialLoading ? (
                            [0, 1].map((key) => <CardSkeleton key={key} />)
                        ) : techniciansState.isUnavailableBeforeData ? (
                            <SourceUnavailable
                                title="Technician data unavailable"
                                description="We couldn't load technician counts right now. Please try again."
                                onRetry={() => resetQuery(allTechniciansQueryKey)}
                                className="sm:col-span-2"
                            />
                        ) : (
                            <>
                                <StatCard label="Technicians" value={technicians.total} icon={Users} helper={`${technicians.available} available`} />
                                <StatCard label="Pending approvals" value={technicians.pending} icon={UserPlus} helper={technicians.pending > 0 ? 'Awaiting review' : undefined} />
                            </>
                        )}
                    </Motion.div>

                    <Motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-2">
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
                                        <ChartContainer height={Math.max(statusData.length * 40, 200)}>
                                            <BarChart data={statusData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                                                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                                                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                                                <YAxis type="category" dataKey="label" width={150} tickLine={false} axisLine={false} />
                                                <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'var(--ds-muted)', opacity: 0.5 }} />
                                                <Bar dataKey="value" name="Requests" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                                                    {statusData.map((entry) => <Cell key={entry.key} fill={entry.fill} />)}
                                                </Bar>
                                            </BarChart>
                                        </ChartContainer>
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
                                        <ChartContainer height={Math.max(categoryData.length * 40, 200)}>
                                            <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                                                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                                                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                                                <YAxis type="category" dataKey="label" width={140} tickLine={false} axisLine={false} />
                                                <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'var(--ds-muted)', opacity: 0.5 }} />
                                                <Bar dataKey="value" name="Requests" radius={[0, 4, 4, 0]} fill="var(--ds-primary)" isAnimationActive={false} />
                                            </BarChart>
                                        </ChartContainer>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </Motion.div>

                    <Motion.div variants={staggerItem}>
                        {paymentsState.isInitialLoading ? (
                            <CardSkeleton />
                        ) : paymentsState.isUnavailableBeforeData ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ReceiptText aria-hidden="true" className="size-4 text-ds-muted-foreground" />
                                        Payments recorded
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
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
                                                    <p className="mt-1 text-lg font-semibold text-ds-foreground tabular-nums">{group.formattedTotal}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="mt-3 text-xs text-ds-muted-foreground">Totals are shown separately per currency and are never combined.</p>
                                </CardContent>
                            </Card>
                        )}
                    </Motion.div>
                </Motion.div>
            </div>
        </MotionConfig>
    );
}

export default AdminOverview;
