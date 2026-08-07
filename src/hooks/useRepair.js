import { useQuery } from '@tanstack/react-query';
import useAuth from './useAuth';
import useAxiosSecure from './useAxiosSecure';
import { repairKeys } from './repairKeys';
import { getRepair } from '../api/repairs';

// 401/403/404 are definitive (404 also covers the existence-oracle-safe "not
// found or not authorized"), so they are never retried.
function shouldRetry(failureCount, error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403 || status === 404) return false;
    return failureCount < 2;
}

export function useRepair(requestId, { enabled = true } = {}) {
    const { user, loading: authLoading } = useAuth();
    const axiosSecure = useAxiosSecure();

    return useQuery({
        queryKey: repairKeys.request(requestId),
        queryFn: () => getRepair(axiosSecure, requestId),
        enabled: !!requestId && !!user && !authLoading && enabled,
        // Signed evidence read urls are short-lived, so keep this fresh.
        staleTime: 15 * 1000,
        retry: shouldRetry,
    });
}
