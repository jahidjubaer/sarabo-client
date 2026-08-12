import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosSecure from './useAxiosSecure';
import { inspectionKeys } from './inspectionKeys';
import { submitInspection } from '../api/inspections';

// Submits the technician inspection. On success, invalidates the inspection
// query (so the form is replaced by the summary), the request-detail query
// (its deliveryStatus is now inspection_completed), and the technician's
// assigned-jobs list. On a controlled server refusal (already submitted / not
// allowed), the inspection query is still refetched so the UI re-syncs to server truth.
export function useSubmitInspection(requestId) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload) => submitInspection(axiosSecure, requestId, payload),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: inspectionKeys.request(requestId) });
            queryClient.invalidateQueries({ queryKey: ['repair-requests', requestId] });
            queryClient.invalidateQueries({ queryKey: ['tech-active-jobs'] });
        },
    });
}
