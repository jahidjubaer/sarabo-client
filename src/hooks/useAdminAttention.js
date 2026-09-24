import { useQuery } from '@tanstack/react-query';
import useAxiosSecure from './useAxiosSecure';
import { getAdminAttention } from '../api/adminAttention';

export const adminAttentionKeys = { all: ['admin-attention'] };

// Requests that need an admin now. Refreshed every minute while shown,
// because a pickup becomes overdue simply by time passing.
export function useAdminAttention() {
    const axiosSecure = useAxiosSecure();
    return useQuery({
        queryKey: adminAttentionKeys.all,
        queryFn: () => getAdminAttention(axiosSecure),
        refetchInterval: 60 * 1000,
    });
}
