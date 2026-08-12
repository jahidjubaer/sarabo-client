import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { motion as Motion, MotionConfig } from 'motion/react';
import { Briefcase, CircleAlert, Wrench, CheckCheck, ChevronRight } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { CardSkeleton } from '../common/Skeletons';
import { Card, CardContent } from '../ui/card';
import { StatusBadge } from '../common/StatusBadge';
import { TechnicianActiveJob } from './TechnicianActiveJob';
import { getProductSummary } from '../../utils/customerRequestPresentation';
import { summarizeJobs, selectActiveJob, getRecentJobs } from '../../utils/technicianJobPresentation';
import { getStatusPresentation } from '../../config/statusPresentation';
import { getRepairStatusActionErrorMessage } from '../../utils/repairStatusActionErrorMessage';
import { notify } from '../../lib/notify';
import { staggerContainer, staggerItem } from '../../theme/motion';

function buildDescription({ total, needsAttention, inRepair }) {
    if (total === 0) return 'You have no repair jobs assigned right now.';
    if (needsAttention > 0) return `${needsAttention} job${needsAttention === 1 ? '' : 's'} need${needsAttention === 1 ? 's' : ''} your attention.`;
    if (inRepair > 0) return `${inRepair} repair${inRepair === 1 ? '' : 's'} in progress.`;
    return 'No jobs need action right now.';
}

// Technician work dashboard (Phase 7.4): an operational overview - counts,
// the current/next job, and a short attention list. No revenue/earnings,
// productivity, or SLA metrics. Reuses the existing ['tech-active-jobs'] query.
function TechnicianOverview() {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [pendingAction, setPendingAction] = useState(null);

    const { data: jobs = [], isLoading, isError, refetch } = useQuery({
        queryKey: ['tech-active-jobs', user?.email],
        queryFn: async () => {
            const res = await axiosSecure.get(`/repair-requests/technician?technicianEmail=${user.email}`);
            return res.data;
        },
    });

    // Preserved status-advance mutation (same endpoint/behaviour as the legacy
    // Assigned Jobs page). Only feedback moved to a toast.
    const handleAdvance = (job, status) => {
        if (pendingAction) return;
        setPendingAction({ id: job._id, status });
        axiosSecure.patch(`/repair-requests/${job._id}/status`, { deliveryStatus: status })
            .then(() => {
                refetch();
                queryClient.invalidateQueries({ queryKey: ['tech-active-jobs', user?.email] });
                queryClient.invalidateQueries({ queryKey: ['completedJobs', user?.email] });
                queryClient.invalidateQueries({ queryKey: ['tech-completed-jobs', user?.email] });
                notify.success(`Updated: ${getStatusPresentation(status).label}`);
            })
            .catch((error) => {
                if (import.meta.env.DEV) console.error('Repair status update failed:', error);
                notify.error(getRepairStatusActionErrorMessage(error));
                refetch();
            })
            .finally(() => setPendingAction(null));
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Technician" title="Work Dashboard" description="Loading your assigned work..." />
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
                <PageHeader eyebrow="Technician" title="Work Dashboard" />
                <ErrorState
                    title="Couldn't load your jobs"
                    description="We couldn't load your assigned work right now. Please try again."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    const summary = summarizeJobs(jobs);
    const activeJob = selectActiveJob(jobs);
    const recent = getRecentJobs(jobs, 4);

    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-6">
                <PageHeader eyebrow="Technician" title="Work Dashboard" description={buildDescription(summary)} />

                {summary.total === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title="No assigned jobs"
                        description="You don't have any repair jobs assigned right now. New assignments will appear here."
                    />
                ) : (
                    <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
                        <Motion.div variants={staggerItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard label="Assigned jobs" value={summary.total} icon={Briefcase} />
                            <StatCard
                                label="Needs attention"
                                value={summary.needsAttention}
                                icon={CircleAlert}
                                helper={summary.needsAttention > 0 ? 'Action needed' : undefined}
                                trend={summary.needsAttention > 0 ? 'down' : undefined}
                            />
                            <StatCard label="In repair" value={summary.inRepair} icon={Wrench} />
                            <StatCard label="Completed" value={summary.completed} icon={CheckCheck} />
                        </Motion.div>

                        {activeJob && (
                            <Motion.div variants={staggerItem}>
                                <TechnicianActiveJob job={activeJob} onAdvance={handleAdvance} pendingAction={pendingAction} />
                            </Motion.div>
                        )}

                        <Motion.div variants={staggerItem}>
                            <Card>
                                <div className="flex items-center justify-between gap-2 border-b border-ds-border px-5 py-3">
                                    <h2 className="text-sm font-semibold text-ds-foreground">Recent jobs</h2>
                                    <Link to="/dashboard/assigned-jobs" className="focus-ring inline-flex items-center gap-1 rounded-ds text-sm font-medium text-ds-primary hover:underline">
                                        View all
                                        <ChevronRight aria-hidden="true" className="size-4" />
                                    </Link>
                                </div>
                                <CardContent className="p-0">
                                    <ul className="divide-y divide-ds-border">
                                        {recent.map((job) => {
                                            const { device, category } = getProductSummary(job);
                                            const presentation = getStatusPresentation(job.deliveryStatus);
                                            return (
                                                <li key={job._id}>
                                                    <Link to={`/dashboard/assigned-jobs/${job._id}`} className="focus-ring flex items-center gap-3 px-5 py-3 hover:bg-ds-muted/50">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium text-ds-foreground">{device}</p>
                                                            <p className="truncate text-xs text-ds-muted-foreground">
                                                                {category && `${category} · `}{presentation.technicianNextStep || presentation.technicianDescription}
                                                            </p>
                                                        </div>
                                                        <StatusBadge status={job.deliveryStatus} showIcon={false} className="shrink-0" />
                                                        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ds-muted-foreground" />
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </CardContent>
                            </Card>
                        </Motion.div>
                    </Motion.div>
                )}
            </div>
        </MotionConfig>
    );
}

export default TechnicianOverview;
