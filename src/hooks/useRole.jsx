import { useQuery } from '@tanstack/react-query';
import useAuth from './useAuth';
import useAxiosSecure from './useAxiosSecure';

const useRole = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();

    const { data: role, isLoading: roleLoading, isError, error } = useQuery({
        // Keyed on the current user's email so switching accounts (logout then
        // a different login) never reads another user's cached role.
        queryKey: ['user-role', user?.email],
        // Don't query at all until a signed-in user's email is available.
        enabled: !!user?.email,
        staleTime: 5 * 60 * 1000,
        queryFn: async () => {
            const res = await axiosSecure.get(`/users/${user.email}/role`);
            return res.data?.role || 'user';
        }
    })

    // No default fallback here: a failed fetch must surface as isError, not
    // silently read as the "user" (customer) role.
    return { role, roleLoading, isError, error };
};

export default useRole;
