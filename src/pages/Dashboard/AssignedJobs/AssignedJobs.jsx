import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { MotionConfig } from 'motion/react';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { CardSkeleton } from '../../../components/common/Skeletons';
import { TechnicianJobFilters } from '../../../components/technician/TechnicianJobFilters';
import { TechnicianJobList } from '../../../components/technician/TechnicianJobList';
import { applyJobView } from '../../../utils/technicianJobPresentation';
import { getStatusPresentation } from '../../../config/statusPresentation';
import { getRepairStatusActionErrorMessage } from '../../../utils/repairStatusActionErrorMessage';
import { notify } from '../../../lib/notify';

// Phase 7.4: Assigned Jobs redesigned onto the design system (no DaisyUI).
// Loads the technician's active assigned jobs (all non-delivered) - a broader,
// more useful view than the old driver_assigned-only table. The status-advance
// mutation (PATCH /repair-requests/:id/status) is PRESERVED exactly: it is the only way
// to reach parcel_picked_up, which unlocks the inspection (see
// RequestDetails / InspectionSection). Only its feedback moved to a toast.
// Everything from pickup onward navigates to the authoritative details screen;
// this page never mutates inspection/quote/repair state. Search/filter/sort are
// pure client-side operations over the already-loaded jobs.
const AssignedJobs = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('all');
    const [sort, setSort] = useState('priority');
    // Tracks which request + action is in flight, so only that job's button
    // disables/relabels - not the whole list.
    const [pendingAction, setPendingAction] = useState(null);

    const jobsQueryKey = ['tech-active-jobs', user?.email];
    const { data: jobsData, refetch, isPending, isPaused, isError } = useQuery({
        queryKey: jobsQueryKey,
        queryFn: async () => {
            const res = await axiosSecure.get(`/repair-requests/technician?technicianEmail=${user.email}`);
            return res.data;
        },
    });
    const hasUsableJobs = Array.isArray(jobsData);
    const jobs = useMemo(() => (Array.isArray(jobsData) ? jobsData : []), [jobsData]);
    const isInitialLoading = isPending && !isPaused;
    const isUnavailableBeforeData = isPaused && !hasUsableJobs;
    const isReadErrorBeforeData = isError && !hasUsableJobs;
    const retryJobs = () => queryClient.resetQueries({ queryKey: jobsQueryKey });

    const visibleJobs = useMemo(() => applyJobView(jobs, { search, group, sort }), [jobs, search, group, sort]);

    const clearFilters = () => {
        setSearch('');
        setGroup('all');
        setSort('priority');
    };

    // Only { deliveryStatus } is sent - the server derives the assigned
    // technician and trackingId from the request document itself (see
    // parcelController.updateParcelStatus). Behaviour unchanged from the legacy
    // page; feedback migrated from SweetAlert to a non-blocking toast.
    const handleAdvance = (request, status) => {
        if (pendingAction) return;
        setPendingAction({ id: request._id, status });
        axiosSecure.patch(`/repair-requests/${request._id}/status`, { deliveryStatus: status })
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
                // A conflict (concurrent update) means the list may be stale -
                // refresh so the technician sees the current state.
                refetch();
            })
            .finally(() => setPendingAction(null));
    };

    if (isInitialLoading) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Technician" title="Assigned Jobs" />
                <div className="space-y-3">
                    {[0, 1, 2, 3].map((key) => <CardSkeleton key={key} className="h-24" />)}
                </div>
            </div>
        );
    }

    if (isReadErrorBeforeData || isUnavailableBeforeData) {
        return (
            <div className="space-y-6">
                <PageHeader eyebrow="Technician" title="Assigned Jobs" />
                <ErrorState
                    title="Couldn't load your jobs"
                    description="We couldn't load your assigned jobs right now. Please try again."
                    onRetry={retryJobs}
                />
            </div>
        );
    }

    const total = jobs.length;
    const description = total === 0 ? 'You have no assigned jobs right now.' : `${total} assigned job${total === 1 ? '' : 's'}`;

    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-6">
                <PageHeader eyebrow="Technician" title="Assigned Jobs" description={description} />

                {total === 0 ? (
                    <EmptyState
                        title="No assigned jobs"
                        description="You don't have any repair jobs assigned right now. New assignments will appear here."
                    />
                ) : (
                    <>
                        <TechnicianJobFilters
                            search={search}
                            onSearchChange={setSearch}
                            group={group}
                            onGroupChange={setGroup}
                            sort={sort}
                            onSortChange={setSort}
                        />
                        <TechnicianJobList
                            jobs={visibleJobs}
                            onClearFilters={clearFilters}
                            onAdvance={handleAdvance}
                            pendingAction={pendingAction}
                        />
                    </>
                )}
            </div>
        </MotionConfig>
    );
};

export default AssignedJobs;
