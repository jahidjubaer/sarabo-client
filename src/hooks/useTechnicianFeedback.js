import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from './useAuth';
import useRole from './useRole';
import useAxiosSecure from './useAxiosSecure';
import { auth } from '../firebase/firebase.init';
import { roleKeys } from './roleKeys';
import { adminReportKeys, adminReviewKeys, feedbackCacheGeneration, feedbackWriteController, technicianReviewKeys, technicianReviewGeneration } from './technicianFeedbackKeys';
import { listAdminReports, getAdminReport, updateReportStatus, addReportNote, listAdminReviews, updateReviewVisibility, listMyTechnicianReviews } from '../api/technicianFeedback';

function useFeedbackAccess() {
    const { user } = useAuth();
    const { role } = useRole();
    const axios = useAxiosSecure();
    return { uid: user?.uid, enabled: !!user?.uid && role === 'admin', axios };
}

export function useAdminFeedbackList(kind, filters) {
    const { uid, enabled, axios } = useFeedbackAccess();
    const keys = kind === 'reports' ? adminReportKeys : adminReviewKeys;
    const queryKey = keys.list(uid, filters);
    const query = useQuery({
        queryKey, enabled,
        queryFn: ({ signal }) => (kind === 'reports' ? listAdminReports : listAdminReviews)(axios, filters, signal),
        retry: false,
    });
    return { ...query, queryKey };
}

export function useAdminReport(id) {
    const { uid, enabled, axios } = useFeedbackAccess();
    const queryKey = adminReportKeys.detail(uid, id);
    const query = useQuery({ queryKey, enabled: enabled && !!id, queryFn: ({ signal }) => getAdminReport(axios, id, signal), retry: false });
    return { ...query, queryKey };
}

export function useFeedbackMutation(kind) {
    const { uid, axios } = useFeedbackAccess();
    const client = useQueryClient();
    const generation = feedbackCacheGeneration(client);
    const keys = kind === 'visibility' ? adminReviewKeys : adminReportKeys;
    const currentSession = () => !!uid && auth.currentUser?.uid === uid
        && client.getQueryData(roleKeys.current()) === 'admin'
        && feedbackCacheGeneration(client) === generation;
    return useMutation({
        mutationKey: [...keys.all, uid, kind],
        retry: false,
        // Never queue a private moderation write for a later account/session.
        networkMode: 'always', gcTime: 0,
        mutationFn: async ({ id, ...body }) => {
            if (!currentSession()) throw Object.assign(new Error('Admin session changed'), { code: 'FEEDBACK_SESSION_CHANGED' });
            const operation = { status: updateReportStatus, note: addReportNote, visibility: updateReviewVisibility }[kind];
            const request = feedbackWriteController(client);
            try {
                const result = await operation(axios, id, body, request.signal);
                if (!currentSession()) throw Object.assign(new Error('Admin session changed'), { code: 'FEEDBACK_SESSION_CHANGED' });
                return result;
            } finally { request.release(); }
        },
        onSettled: () => {
            // Also refresh on conflict/uncertain network outcome. No optimistic
            // edits and no automatic mutation replay with a newer version.
            if (currentSession()) return client.invalidateQueries({ queryKey: keys.all });
        },
    });
}

export function useTechnicianReviews(page, limit = 20) {
    const { user } = useAuth();
    const { role } = useRole();
    const axios = useAxiosSecure();
    const client = useQueryClient();
    const uid = user?.uid;
    const generation = technicianReviewGeneration(client);
    const queryKey = technicianReviewKeys.list(uid, page, limit);
    const currentSession = () => !!uid && auth.currentUser?.uid === uid
        && client.getQueryData(roleKeys.current()) === 'rider'
        && technicianReviewGeneration(client) === generation;
    const query = useQuery({
        queryKey, enabled: !!uid && role === 'rider',
        queryFn: async ({ signal }) => {
            if (!currentSession()) throw Object.assign(new Error('Technician session changed'), { code: 'FEEDBACK_SESSION_CHANGED' });
            const data = await listMyTechnicianReviews(axios, { page, limit }, signal);
            if (!currentSession()) throw Object.assign(new Error('Technician session changed'), { code: 'FEEDBACK_SESSION_CHANGED' });
            return data;
        },
        // Match the nearby Technician profile GET convention: one transient
        // retry, no retry of access/not-found responses or an obsolete session.
        retry: (failureCount, error) => ![401, 403, 404].includes(error?.response?.status)
            && error?.code !== 'FEEDBACK_SESSION_CHANGED' && failureCount < 1,
    });
    return { ...query, queryKey };
}
