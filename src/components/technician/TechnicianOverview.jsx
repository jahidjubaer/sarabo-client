import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { motion as Motion, MotionConfig } from 'motion/react';
import { ArrowRight, Briefcase } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { CardSkeleton } from '../common/Skeletons';
import { buttonVariants } from '../ui/button-variants';
import { TechnicianActiveJob } from './TechnicianActiveJob';
import { TechnicianRecentJobs } from './TechnicianRecentJobs';
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

// Operational Technician dashboard. The established selector chooses one
// focused job; the rest of the already-loaded queue stays secondary.
function TechnicianOverview() {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [pendingAction, setPendingAction] = useState(null);

    const jobsQueryKey = ['tech-active-jobs', user?.email];
    const { data: jobsData, isPending, isPaused, isError, refetch } = useQuery({
        queryKey: jobsQueryKey,
        queryFn: async () => {
            const res = await axiosSecure.get(`/repair-requests/technician?technicianEmail=${user.email}`);
            return res.data;
        },
    });
    const hasUsableJobs = Array.isArray(jobsData);
    const jobs = hasUsableJobs ? jobsData : [];
    const isInitialLoading = isPending && !isPaused;
    const isUnavailableBeforeData = isPaused && !hasUsableJobs;
    const isReadErrorBeforeData = isError && !hasUsableJobs;
    const retryJobs = () => queryClient.resetQueries({ queryKey: jobsQueryKey });

    // Preserved legacy status-advance mutation. Inspection, quote and repair
    // transitions remain owned by their existing detail-workspace mutations.
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

    if (isInitialLoading) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Technician" title="Your repair work" description="Loading your assigned work..." />
                <CardSkeleton className="h-72" />
                <CardSkeleton className="h-40" />
            </div>
        );
    }

    if (isReadErrorBeforeData || isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Technician" title="Your repair work" />
                <ErrorState
                    title="Couldn't load your jobs"
                    description="We couldn't load your assigned work right now. Please try again."
                    onRetry={retryJobs}
                />
            </div>
        );
    }

    const summary = summarizeJobs(jobs);
    const activeJob = selectActiveJob(jobs);
    const recent = getRecentJobs(jobs.filter((job) => job._id !== activeJob?._id), 4);
    const allJobsAction = summary.total > 0 ? (
        <Link to="/dashboard/assigned-jobs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            All assigned jobs
            <ArrowRight aria-hidden="true" />
        </Link>
    ) : null;

    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-6">
                <PageHeader
                    eyebrow="Technician"
                    title="Your repair work"
                    description={buildDescription(summary)}
                    actions={allJobsAction}
                />

                {summary.total === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title="No assigned jobs"
                        description="You don't have any repair jobs assigned right now. New assignments will appear here."
                        className="py-16"
                    />
                ) : (
                    <Motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
                        {activeJob && (
                            <Motion.section variants={staggerItem} aria-labelledby="technician-attention-heading" className="space-y-3">
                                <div>
                                    <p className="ds-label text-ds-primary">Next operational action</p>
                                    <h2 id="technician-attention-heading" className="mt-1 text-xl font-semibold tracking-tight text-ds-foreground">
                                        What job needs your attention now?
                                    </h2>
                                </div>
                                <TechnicianActiveJob job={activeJob} onAdvance={handleAdvance} pendingAction={pendingAction} />
                            </Motion.section>
                        )}

                        <Motion.div variants={staggerItem}>
                            <TechnicianRecentJobs jobs={recent} />
                        </Motion.div>
                    </Motion.div>
                )}
            </div>
        </MotionConfig>
    );
}

export default TechnicianOverview;
