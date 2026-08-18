import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosSecure from './useAxiosSecure';
import { quoteKeys } from './quoteKeys';
import { submitQuote, decideQuote, reviseQuote, cancelAfterQuoteRejection } from '../api/quotes';

// Shared invalidation: after any quote write, refresh the quote query (so the
// form/summary/actions re-render), the request-detail query (deliveryStatus
// changed), and the technician's assigned-jobs list. onSettled runs on both success
// and controlled refusal, so the UI always re-syncs to server truth.
function useQuoteInvalidation(requestId) {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: quoteKeys.request(requestId) });
        queryClient.invalidateQueries({ queryKey: ['repair-requests', requestId] });
        queryClient.invalidateQueries({ queryKey: ['assignedJobs'] });
    };
}

export function useSubmitQuote(requestId) {
    const axiosSecure = useAxiosSecure();
    const invalidate = useQuoteInvalidation(requestId);
    return useMutation({
        mutationFn: (payload) => submitQuote(axiosSecure, requestId, payload),
        onSettled: invalidate,
    });
}

export function useDecideQuote(requestId) {
    const axiosSecure = useAxiosSecure();
    const invalidate = useQuoteInvalidation(requestId);
    return useMutation({
        mutationFn: (decision) => decideQuote(axiosSecure, requestId, decision),
        onSettled: invalidate,
    });
}

// Post-rejection technician actions (Phase 9.2). Both reuse the SAME
// invalidation as submit/decide - reopening for revision changes deliveryStatus
// back to inspection_completed and clears the live quote, and cancelling moves
// the request to cancelled, so exactly the same three caches are stale.
export function useReviseQuote(requestId) {
    const axiosSecure = useAxiosSecure();
    const invalidate = useQuoteInvalidation(requestId);
    return useMutation({
        mutationFn: () => reviseQuote(axiosSecure, requestId),
        onSettled: invalidate,
    });
}

export function useCancelAfterQuoteRejection(requestId) {
    const axiosSecure = useAxiosSecure();
    const invalidate = useQuoteInvalidation(requestId);
    return useMutation({
        mutationFn: () => cancelAfterQuoteRejection(axiosSecure, requestId),
        onSettled: invalidate,
    });
}
