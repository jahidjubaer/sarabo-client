import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion as Motion, MotionConfig } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { CheckCheck, ClipboardList, ReceiptText, UserPlus, Users, Wrench } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { PageHeader } from '../common/PageHeader';
import { ErrorState } from '../common/ErrorState';
import { CardSkeleton } from '../common/Skeletons';
import { AdminBlockedWork } from './AdminBlockedWork';
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

function OperationalMetric({ label, value, icon, helper, tone = 'default' }) {
    const MetricIcon = icon;
    return (
        <div className="flex min-w-0 items-start gap-3 rounded-ds border border-ds-border bg-ds-background/45 p-3">
            <span className={tone === 'action' ? 'mt-0.5 text-ds-warning' : 'mt-0.5 text-ds-primary'}>
                <MetricIcon aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
                <p className="text-xl font-semibold tabular-nums text-ds-foreground">{value}</p>
                <p className="text-xs font-medium text-ds-foreground">{label}</p>
                {helper && <p className="mt-0.5 text-xs text-ds-muted-foreground">{helper}</p>}
            </div>
        </div>
    );
}

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
            <div className="space-y-7">
                <PageHeader eyebrow="Admin" title="Operations Dashboard" description="Resolve blocked repair work first, then review workload and supporting analytics." />

                <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
                    <Motion.div variants={staggerItem}>
                        <AdminBlockedWork
                            requests={requestsState.hasUsableData ? requestsQuery.data : []}
                            technicians={techniciansState.hasUsableData ? techniciansQuery.data : []}
                            requestsState={requestsState}
                            techniciansState={techniciansState}
                            onRetryRequests={() => resetQuery(allRequestsQueryKey)}
                            onRetryTechnicians={() => resetQuery(allTechniciansQueryKey)}
                        />
                    </Motion.div>

                    <Motion.section variants={staggerItem} aria-labelledby="admin-workload-heading" className="space-y-4">
                        <div>
                            <p className="ds-label text-ds-muted-foreground">Workload</p>
                            <h2 id="admin-workload-heading" className="mt-1 text-lg font-semibold tracking-tight text-ds-foreground">Operational counts</h2>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {statsState.isInitialLoading ? (
                                <CardSkeleton />
                            ) : statsState.isUnavailableBeforeData ? (
                                <SourceUnavailable
                                    title="Request status unavailable"
                                    description="We couldn't load request status counts right now. Please try again."
                                    onRetry={() => resetQuery(statusStatsQueryKey)}
                                />
                            ) : (
                                <Card>
                                    <CardHeader><CardTitle>Repair workload</CardTitle></CardHeader>
                                    <CardContent className="grid gap-3 sm:grid-cols-2">
                                        <OperationalMetric label="Total requests" value={summary.total} icon={ClipboardList} />
                                        <OperationalMetric label="Awaiting assignment" value={summary.awaitingAssignment} icon={UserPlus} helper={summary.awaitingAssignment > 0 ? 'Admin action required' : 'Queue clear'} tone="action" />
                                        <OperationalMetric label="Active repairs" value={summary.active} icon={Wrench} />
                                        <OperationalMetric label="Completed repairs" value={summary.completed} icon={CheckCheck} />
                                    </CardContent>
                                </Card>
                            )}

                            {techniciansState.isInitialLoading ? (
                                <CardSkeleton />
                            ) : techniciansState.isUnavailableBeforeData ? (
                                <SourceUnavailable
                                    title="Technician data unavailable"
                                    description="We couldn't load Technician counts right now. Please try again."
                                    onRetry={() => resetQuery(allTechniciansQueryKey)}
                                />
                            ) : (
                                <Card>
                                    <CardHeader><CardTitle>Technician workforce</CardTitle></CardHeader>
                                    <CardContent className="grid gap-3 sm:grid-cols-2">
                                        <OperationalMetric label="Technicians" value={technicians.total} icon={Users} helper={`${technicians.available} available`} />
                                        <OperationalMetric label="Pending approvals" value={technicians.pending} icon={UserPlus} helper={technicians.pending > 0 ? 'Admin review required' : 'Review queue clear'} tone="action" />
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </Motion.section>

                    <Motion.section variants={staggerItem} aria-labelledby="admin-payment-context-heading" className="space-y-4">
                        <div>
                            <p className="ds-label text-ds-muted-foreground">Supporting context</p>
                            <h2 id="admin-payment-context-heading" className="mt-1 text-lg font-semibold tracking-tight text-ds-foreground">Recorded payments</h2>
                        </div>
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
                        <div>
                            <p className="ds-label text-ds-muted-foreground">Supporting analytics</p>
                            <h2 id="admin-analytics-heading" className="mt-1 text-lg font-semibold tracking-tight text-ds-foreground">Repair request distribution</h2>
                            <p className="mt-1 text-sm text-ds-muted-foreground">Existing request counts grouped by workflow status and device category.</p>
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
                        </div>
                    </Motion.section>
                </Motion.div>
            </div>
        </MotionConfig>
    );
}

export default AdminOverview;
