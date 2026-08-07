import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosSecure from './useAxiosSecure';
import { repairKeys } from './repairKeys';
import { startRepair, addProgress, completeRepair } from '../api/repairs';

// Shared invalidation: after any repair write, refresh the repair query (so the
// timeline/summary re-render), the request-detail query (deliveryStatus
// changed), and the technician's assigned-jobs list. onSettled runs on both
// success and controlled refusal so the UI always re-syncs to server truth.
function useRepairInvalidation(requestId) {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: repairKeys.request(requestId) });
        queryClient.invalidateQueries({ queryKey: ['parcels', requestId] });
        queryClient.invalidateQueries({ queryKey: ['assignedJobs'] });
    };
}

export function useStartRepair(requestId) {
    const axiosSecure = useAxiosSecure();
    const invalidate = useRepairInvalidation(requestId);
    return useMutation({
        mutationFn: () => startRepair(axiosSecure, requestId),
        onSettled: invalidate,
    });
}

export function useAddProgress(requestId) {
    const axiosSecure = useAxiosSecure();
    const invalidate = useRepairInvalidation(requestId);
    return useMutation({
        mutationFn: (payload) => addProgress(axiosSecure, requestId, payload),
        onSettled: invalidate,
    });
}

export function useCompleteRepair(requestId) {
    const axiosSecure = useAxiosSecure();
    const invalidate = useRepairInvalidation(requestId);
    return useMutation({
        mutationFn: (payload) => completeRepair(axiosSecure, requestId, payload),
        onSettled: invalidate,
    });
}
