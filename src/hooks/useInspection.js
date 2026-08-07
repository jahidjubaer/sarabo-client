import { useQuery } from '@tanstack/react-query';
import useAuth from './useAuth';
import useAxiosSecure from './useAxiosSecure';
import { inspectionKeys } from './inspectionKeys';
import { getInspection } from '../api/inspections';

// A confirmed 401/403/404 is a definitive outcome, not a transient failure -
// 404 also covers the server's existence-oracle-safe "not found or not
// authorized" response, so retrying it would only spam a permanent denial.
function shouldRetry(failureCount, error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403 || status === 404) return false;
    return failureCount < 2;
}

export function useInspection(requestId, { enabled = true } = {}) {
    const { user, loading: authLoading } = useAuth();
    const axiosSecure = useAxiosSecure();

    return useQuery({
        queryKey: inspectionKeys.request(requestId),
        queryFn: () => getInspection(axiosSecure, requestId),
        enabled: !!requestId && !!user && !authLoading && enabled,
        staleTime: 60 * 1000,
        retry: shouldRetry,
    });
}
