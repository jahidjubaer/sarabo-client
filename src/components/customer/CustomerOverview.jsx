import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { motion as Motion, MotionConfig } from 'motion/react';
import { Plus, Package, CircleCheckBig } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { PageHeader } from '../common/PageHeader';
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
    const queryClient = useQueryClient();
    const requestsQueryKey = ['my-requests', user?.email];

    const { data: requestsData, isPending, isPaused, isError } = useQuery({
        queryKey: requestsQueryKey,
        queryFn: async () => {
            const res = await axiosSecure.get('/repair-requests');
            return res.data;
        },
    });
    const hasUsableRequests = Array.isArray(requestsData);
    const requests = hasUsableRequests ? requestsData : [];
    const isInitialLoading = isPending && !isPaused;
    const isUnavailableBeforeData = isPaused && !hasUsableRequests;
    const retryRequests = () => queryClient.resetQueries({ queryKey: requestsQueryKey });

    const newRequestAction = (
        <Link to="/dashboard/create-request" className={buttonVariants({ size: 'sm' })}>
            <Plus aria-hidden="true" />
            New Repair Request
        </Link>
    );

    if (isInitialLoading) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Customer" title="Your repairs" description="Loading your repair activity..." actions={newRequestAction} />
                <CardSkeleton className="h-64" />
                <CardSkeleton className="h-40" />
            </div>
        );
    }

    if (isError || isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Customer" title="Your repairs" actions={newRequestAction} />
                <ErrorState
                    title="Couldn't load your dashboard"
                    description="We couldn't load your repair activity right now. Please try again."
                    onRetry={retryRequests}
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
                    title="Your repairs"
                    description={buildDescription(summary)}
                    actions={newRequestAction}
                />

                {summary.total === 0 ? (
                    <EmptyState
                        icon={Package}
                        title="No repair requests yet"
                        description="When you request a repair, you'll be able to track its progress here."
                        className="py-16"
                        action={
                            <Link to="/dashboard/create-request" className={buttonVariants({ variant: 'action', size: 'sm' })}>
                                <Plus aria-hidden="true" />
                                Create repair request
                            </Link>
                        }
                    />
                ) : (
                    <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
                        <Motion.section variants={staggerItem} aria-labelledby="customer-attention-heading" className="space-y-3">
                            <div>
                                <p className="ds-label text-ds-primary">Next action</p>
                                <h2 id="customer-attention-heading" className="mt-1 text-xl font-semibold tracking-tight text-ds-foreground">What needs your attention?</h2>
                            </div>
                            {snapshot ? (
                                <ActiveRepairCard request={snapshot} />
                            ) : (
                                <EmptyState
                                    icon={CircleCheckBig}
                                    title="No active repairs"
                                    description="You have no repair requests that need your attention right now."
                                    className="py-8"
                                    headingLevel={3}
                                    action={
                                        <Link to="/dashboard/create-request" className={buttonVariants({ variant: 'action', size: 'sm' })}>
                                            <Plus aria-hidden="true" />
                                            Create repair request
                                        </Link>
                                    }
                                />
                            )}
                        </Motion.section>

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
