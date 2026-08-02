import { useQuery } from '@tanstack/react-query';
import useAuth from './useAuth';
import useAxiosSecure from './useAxiosSecure';
import { roleKeys } from './roleKeys';

const useRole = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();

    const { data: role, isLoading: roleLoading, isError, error } = useQuery({
        // Never keyed on email/uid - account isolation instead relies on
        // explicitly clearing this cache branch on logout/account change
        // (see AuthProvider.jsx), the same pattern already used for
        // notifications (see notificationKeys.js).
        queryKey: roleKeys.current(),
        // Don't query at all until a signed-in user exists - the server
        // derives identity entirely from the verified Firebase token, so no
        // client-side identity value needs to be ready here.
        enabled: !!user,
        staleTime: 5 * 60 * 1000,
        queryFn: async () => {
            // No email/UID in the URL - the server derives identity from
            // the Authorization token (see useAxiosSecure).
            const res = await axiosSecure.get('/users/me/role');
            return res.data?.role || 'user';
        }
    })

    // No default fallback here: a failed fetch must surface as isError, not
    // silently read as the "user" (customer) role.
    return { role, roleLoading, isError, error };
};

export default useRole;
