import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuth from './useAuth';
import useRole from './useRole';
import useAxiosSecure from './useAxiosSecure';
import { auth } from '../firebase/firebase.init';
import { roleKeys } from './roleKeys';
import { repairFeedbackKeys, repairFeedbackGeneration, repairFeedbackWriteController } from './repairFeedbackKeys';
import { getRepairFeedback, submitRepairReview, submitTechnicianReport } from '../api/technicianFeedback';
import { hasCustomerFeedback } from '../utils/customerFeedback';
import { validFeedbackId } from '../utils/technicianFeedback';

function useCustomerFeedbackAccess(requestId) {
    const { user } = useAuth();
    const { role } = useRole();
    const client = useQueryClient();
    const axios = useAxiosSecure();
    const session = { uid: user?.uid, generation: repairFeedbackGeneration(client), queryKey: repairFeedbackKeys.request(user?.uid, requestId) };
    const isCurrent = (snapshot) => !!snapshot?.uid && auth.currentUser?.uid === snapshot.uid
        && client.getQueryData(roleKeys.current()) === 'user' && repairFeedbackGeneration(client) === snapshot.generation;
    return { client, axios, session, isCurrent, enabled: !!user?.uid && role === 'user' && validFeedbackId(requestId) };
}

const sessionError = () => Object.assign(new Error('Customer session changed'), { code: 'FEEDBACK_SESSION_CHANGED' });

export function useRepairFeedback(requestId) {
    const { axios, session, isCurrent, enabled } = useCustomerFeedbackAccess(requestId);
    const query = useQuery({
        queryKey: session.queryKey, enabled, retry: false,
        queryFn: async ({ signal }) => {
            if (!isCurrent(session)) throw sessionError();
            const data = await getRepairFeedback(axios, requestId, signal);
            if (!isCurrent(session)) throw sessionError();
            return data;
        },
    });
    return { ...query, queryKey: session.queryKey };
}

export function useCustomerFeedbackMutation(requestId, kind) {
    const { client, axios, session, isCurrent } = useCustomerFeedbackAccess(requestId);
    const mutation = useMutation({
        mutationKey: [...session.queryKey, kind], retry: false, networkMode: 'always', gcTime: 0,
        onMutate: () => session,
        mutationFn: async (body) => {
            if (!isCurrent(session)) throw sessionError();
            const request = repairFeedbackWriteController(client);
            try {
                const result = await (kind === 'review' ? submitRepairReview : submitTechnicianReport)(axios, requestId, body, request.signal);
                if (!isCurrent(session)) throw sessionError();
                return result;
            } finally { request.release(); }
        },
        onSuccess: (result, _body, snapshot) => {
            if (!isCurrent(snapshot)) return;
            // Only a completed POST response is reflected, never an optimistic
            // review/report or invented eligibility. GET refreshes the options.
            client.setQueryData(snapshot.queryKey, (previous) => {
                if (!hasCustomerFeedback(previous)) return previous;
                return kind === 'review' ? { ...previous, ownReview: result }
                    : { ...previous, reports: [...previous.reports.filter((item) => item._id !== result._id), result] };
            });
        },
        onSettled: (_data, _error, _body, snapshot) => {
            if (isCurrent(snapshot)) return client.invalidateQueries({ queryKey: snapshot.queryKey, exact: true });
        },
    });
    return { ...mutation, isSessionCurrent: () => isCurrent(session) };
}
