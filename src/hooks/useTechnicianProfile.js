import { useQuery } from '@tanstack/react-query';
import useAxiosSecure from './useAxiosSecure';
import { technicianKeys } from './technicianKeys';

// The signed-in technician's own stored application/profile record.
//
// Enabled only for the 'rider' role: GET /technicians/me is technician-gated
// server-side, so firing it for a customer or admin would produce a guaranteed
// 403 on every profile page view for no reason.
//
// A 404 (TECHNICIAN_PROFILE_NOT_FOUND) is a real answer, not a transport
// failure, so it is not retried - a rider with no technician record should see
// the honest empty state immediately.
export function useTechnicianProfile(role) {
    const axiosSecure = useAxiosSecure();
    return useQuery({
        queryKey: technicianKeys.me(),
        enabled: role === 'rider',
        queryFn: async () => {
            const res = await axiosSecure.get('/technicians/me');
            return res.data;
        },
        retry: (failureCount, error) => {
            const status = error?.response?.status;
            if (status === 404 || status === 403) return false;
            return failureCount < 1;
        },
    });
}
