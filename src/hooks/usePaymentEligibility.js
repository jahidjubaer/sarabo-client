import { useQuery } from '@tanstack/react-query';
import useAuth from './useAuth';
import useAxiosSecure from './useAxiosSecure';
import { paymentKeys } from './paymentKeys';
import { getV2PaymentEligibility } from '../api/payments';

// 401/403/404 are definitive (403 = not the owner, 404 = not found / no access),
// so they are never retried.
function shouldRetry(failureCount, error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403 || status === 404) return false;
    return failureCount < 2;
}

// Server-authoritative payment eligibility for a v2 approved quote. The client
// shows Pay Now only when this says eligible - never inferred from the quote
// status alone. Enabled only for the request owner (the endpoint is owner-only;
// a non-owner would just get a 403), gated by the caller via `enabled`.
export function usePaymentEligibility(requestId, { enabled = true } = {}) {
    const { user, loading: authLoading } = useAuth();
    const axiosSecure = useAxiosSecure();

    return useQuery({
        queryKey: paymentKeys.eligibility(requestId),
        queryFn: () => getV2PaymentEligibility(axiosSecure, requestId),
        enabled: !!requestId && !!user && !authLoading && enabled,
        // Short-lived: eligibility flips the moment a payment completes, so it
        // should not linger cached long after the customer pays.
        staleTime: 15 * 1000,
        retry: shouldRetry,
    });
}
