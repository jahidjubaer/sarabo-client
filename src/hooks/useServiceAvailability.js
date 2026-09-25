import { useQuery } from '@tanstack/react-query';
import useAxiosSecure from './useAxiosSecure';

export const serviceAvailabilityKeys = {
    all: ['service-availability'],
    one: (region, serviceDefinitionId) => ['service-availability', region, serviceDefinitionId],
};

// Is there a technician in this region for this repair? (job-portal phase A)
// An early warning for the create form; the server re-checks on submit.
export function useServiceAvailability(region, serviceDefinitionId) {
    const axiosSecure = useAxiosSecure();
    return useQuery({
        queryKey: serviceAvailabilityKeys.one(region, serviceDefinitionId),
        queryFn: async () => (await axiosSecure.get('/service-availability', { params: { region, serviceDefinitionId } })).data,
        enabled: Boolean(region) && Boolean(serviceDefinitionId),
        staleTime: 60 * 1000,
    });
}
