import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import useAuth from './useAuth';
import useAxiosSecure from './useAxiosSecure';
import { notificationKeys, normalizeListParams } from './notificationKeys';
import {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
} from '../api/notifications';

// A confirmed 401/403 is a definitive auth outcome (useAxiosSecure's own
// interceptor already attempted one token refresh+retry, and forces logout
// on a confirmed-invalid session) - retrying it again here would only spam
// the server. Anything else gets a couple of conservative retries.
function shouldRetry(failureCount, error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) return false;
    return failureCount < 2;
}

// `keepPreviousPage` is off by default (the bell preview never needs it,
// since it only ever fetches page 1) - the paginated Notification Center
// page opts in so changing pages doesn't flash a loading skeleton over
// already-visible content (mirrors ManageRepairRequests.jsx's identical use
// of TanStack Query's keepPreviousData for the same reason).
export function useNotifications(params = {}, { enabled = true, keepPreviousPage = false } = {}) {
    const { user, loading: authLoading } = useAuth();
    const axiosSecure = useAxiosSecure();
    const normalizedParams = normalizeListParams(params);

    return useQuery({
        queryKey: notificationKeys.list(normalizedParams),
        queryFn: () => getNotifications(axiosSecure, normalizedParams),
        // Never issued until a signed-in user exists and auth has resolved -
        // and, for the bell preview list, only once the caller opens it.
        enabled: !!user && !authLoading && enabled,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
        retry: shouldRetry,
        placeholderData: keepPreviousPage ? keepPreviousData : undefined,
    });
}

export function useUnreadNotificationCount() {
    const { user, loading: authLoading } = useAuth();
    const axiosSecure = useAxiosSecure();

    return useQuery({
        queryKey: notificationKeys.unreadCount(),
        queryFn: () => getUnreadNotificationCount(axiosSecure),
        enabled: !!user && !authLoading,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        refetchOnWindowFocus: true,
        retry: shouldRetry,
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    const axiosSecure = useAxiosSecure();

    return useMutation({
        mutationFn: (notificationId) => markNotificationRead(axiosSecure, notificationId),
        onMutate: async (notificationId) => {
            await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
            await queryClient.cancelQueries({ queryKey: notificationKeys.unreadCount() });

            const previousLists = queryClient.getQueriesData({ queryKey: notificationKeys.lists() });
            const previousCount = queryClient.getQueryData(notificationKeys.unreadCount());
            let wasUnread = false;

            queryClient.setQueriesData({ queryKey: notificationKeys.lists() }, (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((item) => {
                        if (item._id !== notificationId) return item;
                        if (!item.isRead) wasUnread = true;
                        return { ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() };
                    }),
                };
            });

            if (wasUnread) {
                queryClient.setQueryData(notificationKeys.unreadCount(), (old) => {
                    const current = typeof old?.count === 'number' ? old.count : 0;
                    return { ...old, count: Math.max(current - 1, 0) };
                });
            }

            return { previousLists, previousCount };
        },
        onError: (_error, _notificationId, context) => {
            context?.previousLists?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            if (context?.previousCount !== undefined) {
                queryClient.setQueryData(notificationKeys.unreadCount(), context.previousCount);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();
    const axiosSecure = useAxiosSecure();

    return useMutation({
        mutationFn: () => markAllNotificationsRead(axiosSecure),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: notificationKeys.lists() });
            await queryClient.cancelQueries({ queryKey: notificationKeys.unreadCount() });

            const previousLists = queryClient.getQueriesData({ queryKey: notificationKeys.lists() });
            const previousCount = queryClient.getQueryData(notificationKeys.unreadCount());

            queryClient.setQueriesData({ queryKey: notificationKeys.lists() }, (old) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((item) =>
                        item.isRead ? item : { ...item, isRead: true, readAt: new Date().toISOString() }
                    ),
                };
            });
            queryClient.setQueryData(notificationKeys.unreadCount(), (old) => ({ ...old, count: 0 }));

            return { previousLists, previousCount };
        },
        onError: (_error, _variables, context) => {
            context?.previousLists?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            if (context?.previousCount !== undefined) {
                queryClient.setQueryData(notificationKeys.unreadCount(), context.previousCount);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        },
    });
}
