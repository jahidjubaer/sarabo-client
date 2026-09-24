import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from './useAuth';
import useAxiosSecure from './useAxiosSecure';
import { getStatusPresentation } from '../config/statusPresentation';
import { getRepairStatusActionErrorMessage } from '../utils/repairStatusActionErrorMessage';
import { getAssignmentDecisionErrorMessage } from '../utils/assignmentDecision';
import { notify } from '../lib/notify';

// The technician's assigned jobs plus the three actions a job list can take
// (Phase 4). The work-queue home and Assigned Jobs used to each carry their own
// copy of the query and the status-advance mutation; this is that code, once.
//
// Every call is an existing endpoint with its existing payload - the server
// derives the technician from the verified token and re-checks every
// transition:
//   advance  PATCH /repair-requests/:id/status              { deliveryStatus }
//   accept   POST  /repair-requests/:id/assignment/accept
//   decline  POST  /repair-requests/:id/assignment/reject  { reason }
// The accept/decline pair is the same one the job details page uses.
export function useTechnicianJobs() {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    // { id, kind } of the one job whose action is in flight, so only that
    // job's controls disable - never the whole list.
    const [pending, setPending] = useState(null);

    const jobsQueryKey = ['tech-active-jobs', user?.email];
    const query = useQuery({
        queryKey: jobsQueryKey,
        queryFn: async () => (await axiosSecure.get(`/repair-requests/technician?technicianEmail=${user.email}`)).data,
    });
    const hasUsableJobs = Array.isArray(query.data);
    const jobs = hasUsableJobs ? query.data : [];

    const refreshLists = (id) => {
        query.refetch();
        queryClient.invalidateQueries({ queryKey: ['tech-active-jobs', user?.email] });
        queryClient.invalidateQueries({ queryKey: ['completedJobs', user?.email] });
        queryClient.invalidateQueries({ queryKey: ['tech-completed-jobs', user?.email] });
        if (id) queryClient.invalidateQueries({ queryKey: ['repair-requests', id] });
    };

    const run = (job, kind, request, onSuccess, errorMessage) => {
        if (pending) return Promise.resolve(false);
        setPending({ id: job._id, kind });
        return request()
            .then(() => {
                refreshLists(job._id);
                onSuccess();
                return true;
            })
            .catch((error) => {
                if (import.meta.env.DEV) console.error(`Technician ${kind} failed:`, error);
                notify.error(errorMessage(error));
                query.refetch();
                return false;
            })
            .finally(() => setPending(null));
    };

    const advance = (job, nextStatus) => run(
        job, 'advance',
        () => axiosSecure.patch(`/repair-requests/${job._id}/status`, { deliveryStatus: nextStatus }),
        () => notify.success(`Updated: ${getStatusPresentation(nextStatus).label}`),
        getRepairStatusActionErrorMessage,
    );

    const accept = (job) => run(
        job, 'accept',
        () => axiosSecure.post(`/repair-requests/${job._id}/assignment/accept`),
        () => notify.success('Job accepted.'),
        getAssignmentDecisionErrorMessage,
    );

    const decline = (job, reason) => run(
        job, 'decline',
        () => axiosSecure.post(`/repair-requests/${job._id}/assignment/reject`, { reason }),
        () => notify.success('Job declined. It will be offered to another technician.'),
        getAssignmentDecisionErrorMessage,
    );

    return {
        jobs,
        hasUsableJobs,
        isInitialLoading: query.isPending && !query.isPaused,
        isUnavailableBeforeData: (query.isPaused || query.isError) && !hasUsableJobs,
        retry: () => queryClient.resetQueries({ queryKey: jobsQueryKey }),
        pending,
        advance,
        accept,
        decline,
    };
}
