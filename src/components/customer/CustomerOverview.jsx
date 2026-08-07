import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { motion as Motion, MotionConfig } from 'motion/react';
import { Plus, Package, ClipboardList, CircleAlert, CheckCheck } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { CardSkeleton } from '../common/Skeletons';
import { buttonVariants } from '../ui/button-variants';
import { ActiveRepairCard } from './ActiveRepairCard';
import { RecentRequests } from './RecentRequests';
import { CustomerQuickActions } from './CustomerQuickActions';
import { summarizeRequests, selectActiveSnapshot, getRecentRequests } from '../../utils/customerRequestPresentation';
import { staggerContainer, staggerItem } from '../../theme/motion';

function plural(count) {
    return count === 1 ? '' : 's';
}

function buildDescription({ total, active, needsAction }) {
    if (total === 0) return 'Create your first repair request to get started.';
    if (needsAction > 0) return `You have ${needsAction} request${plural(needsAction)} that need${needsAction === 1 ? 's' : ''} your attention.`;
    if (active > 0) return `You have ${active} active repair${plural(active)} in progress.`;
    return 'No active repairs right now - everything is up to date.';
}

// Customer dashboard overview (Phase 7.3): a service-focused summary, not an
// analytics dashboard. Answers "do I have an active repair, what stage is it
// in, what should I do next, what happened recently, how do I start another".
// Reuses the existing ['my-requests'] query (shared cache with My Requests) -
// no new endpoints, no invented metrics.
function CustomerOverview() {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();

    const { data: requests = [], isLoading, isError, refetch } = useQuery({
        queryKey: ['my-requests', user?.email],
        queryFn: async () => {
            const res = await axiosSecure.get('/parcels');
            return res.data;
        },
    });

    const newRequestAction = (
        <Link to="/dashboard/create-request" className={buttonVariants({ size: 'sm' })}>
            <Plus aria-hidden="true" />
            New Repair Request
        </Link>
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Customer" title="Repair Dashboard" description="Loading your repair activity..." actions={newRequestAction} />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((key) => <CardSkeleton key={key} />)}
                </div>
                <CardSkeleton className="h-40" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Customer" title="Repair Dashboard" actions={newRequestAction} />
                <ErrorState
                    title="Couldn't load your dashboard"
                    description="We couldn't load your repair activity right now. Please try again."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    const summary = summarizeRequests(requests);
    const snapshot = selectActiveSnapshot(requests);
    const recent = getRecentRequests(requests, 4);

    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-6">
                <PageHeader
                    eyebrow="Customer"
                    title="Repair Dashboard"
                    description={buildDescription(summary)}
                    actions={newRequestAction}
                />

                {summary.total === 0 ? (
                    <EmptyState
                        icon={Package}
                        title="No repair requests yet"
                        description="When you request a repair, you'll be able to track its progress here."
                        action={
                            <Link to="/dashboard/create-request" className={buttonVariants({ size: 'sm' })}>
                                <Plus aria-hidden="true" />
                                Create repair request
                            </Link>
                        }
                    />
                ) : (
                    <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
                        <Motion.div variants={staggerItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard label="Total requests" value={summary.total} icon={Package} />
                            <StatCard label="Active repairs" value={summary.active} icon={ClipboardList} />
                            <StatCard
                                label="Needs your action"
                                value={summary.needsAction}
                                icon={CircleAlert}
                                helper={summary.needsAction > 0 ? 'Action needed' : undefined}
                                trend={summary.needsAction > 0 ? 'down' : undefined}
                            />
                            <StatCard label="Completed" value={summary.completed} icon={CheckCheck} />
                        </Motion.div>

                        {snapshot && (
                            <Motion.div variants={staggerItem}>
                                <ActiveRepairCard request={snapshot} />
                            </Motion.div>
                        )}

                        <Motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <RecentRequests requests={recent} />
                            </div>
                            <div>
                                <h2 className="mb-3 text-sm font-semibold text-ds-foreground">Quick actions</h2>
                                <CustomerQuickActions />
                            </div>
                        </Motion.div>
                    </Motion.div>
                )}
            </div>
        </MotionConfig>
    );
}

export default CustomerOverview;
