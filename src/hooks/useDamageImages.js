import { useQuery } from '@tanstack/react-query';
import useAuth from './useAuth';
import useAxiosSecure from './useAxiosSecure';
import { damageImageKeys } from './damageImageKeys';
import { getDamageImages } from '../api/damageImages';

// A confirmed 401/403/404 is a definitive outcome, not a transient failure -
// mirrors useNotifications.js's own shouldRetry. 404 additionally covers the
// server's existence-oracle-safe "not found or not authorized" response, so
// retrying it would only spam the server for a permanent denial.
function shouldRetry(failureCount, error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403 || status === 404) return false;
    return failureCount < 2;
}

// Signed read URLs expire 5 minutes after issuance (server-owned, see
// sarabo-server's utils/damageUpload.js#READ_URL_TTL_MS) - staleTime is set
// below that so a component reading this data always either has a fresh
// background refetch already in flight or triggers one, rather than
// silently serving a URL that's about to (or already did) expire.
const READ_URL_TTL_MS = 5 * 60 * 1000;
const STALE_TIME_MS = 4 * 60 * 1000;

export function useDamageImages(requestId, { enabled = true } = {}) {
    const { user, loading: authLoading } = useAuth();
    const axiosSecure = useAxiosSecure();

    return useQuery({
        queryKey: damageImageKeys.request(requestId),
        queryFn: () => getDamageImages(axiosSecure, requestId),
        enabled: !!requestId && !!user && !authLoading && enabled,
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: true,
        retry: shouldRetry,
    });
}

export { READ_URL_TTL_MS };
