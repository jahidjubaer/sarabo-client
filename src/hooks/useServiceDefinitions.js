import { useQuery } from '@tanstack/react-query';
import useAxios from './useAxios';
import { serviceDefinitionKeys } from './serviceDefinitionKeys';
import { getServiceDefinitions } from '../api/serviceDefinitions';

const STALE_TIME_MS = 5 * 60 * 1000;

// Fetches the full active-service catalogue once - the v2 request form
// derives product categories and per-product service lists from this single
// list client-side (src/utils/serviceDefinitionCatalog.js) rather than
// issuing a separate request per render or per selected item. Public data:
// fetched regardless of auth state, never gated on `user`/`authLoading`
// (contrast useDamageImages.js, which is gated since that data is private).
export function useServiceDefinitions() {
    const axiosPublic = useAxios();
    return useQuery({
        queryKey: serviceDefinitionKeys.list(),
        queryFn: () => getServiceDefinitions(axiosPublic),
        staleTime: STALE_TIME_MS,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}
