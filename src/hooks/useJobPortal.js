import { useQuery } from '@tanstack/react-query';
import useAxios from './useAxios';
import useAxiosSecure from './useAxiosSecure';
import { getJobPortal, getOpenJobs, getRequestApplications } from '../api/jobPortal';

export const jobPortalKeys = {
    portal: ['job-portal'],
    openJobs: ['open-jobs'],
    applications: (requestId) => ['job-applications', requestId],
};

// Open jobs this technician can apply for. Refreshed every minute: jobs
// appear and close as customers choose.
export function useJobPortal({ enabled = true } = {}) {
    const axiosSecure = useAxiosSecure();
    return useQuery({ queryKey: jobPortalKeys.portal, queryFn: () => getJobPortal(axiosSecure), refetchInterval: 60 * 1000, enabled });
}

// The public jobs board (anyone, signed in or not).
export function useOpenJobs({ enabled = true } = {}) {
    const axiosPublic = useAxios();
    return useQuery({ queryKey: jobPortalKeys.openJobs, queryFn: () => getOpenJobs(axiosPublic), refetchInterval: 60 * 1000, enabled });
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
