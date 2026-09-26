import { useQuery } from '@tanstack/react-query';
import useAxiosSecure from './useAxiosSecure';
import { getJobPortal, getRequestApplications } from '../api/jobPortal';

export const jobPortalKeys = {
    portal: ['job-portal'],
    applications: (requestId) => ['job-applications', requestId],
};

// Open jobs this technician can apply for. Refreshed every minute: jobs
// appear and close as customers choose.
export function useJobPortal() {
    const axiosSecure = useAxiosSecure();
    return useQuery({ queryKey: jobPortalKeys.portal, queryFn: () => getJobPortal(axiosSecure), refetchInterval: 60 * 1000 });
}

// Applications for one request (its owner, or an admin).
export function useRequestApplications(requestId, { enabled = true } = {}) {
    const axiosSecure = useAxiosSecure();
    return useQuery({
        queryKey: jobPortalKeys.applications(requestId),
        queryFn: () => getRequestApplications(axiosSecure, requestId),
        enabled: Boolean(requestId) && enabled,
        refetchInterval: 60 * 1000,
    });
}
