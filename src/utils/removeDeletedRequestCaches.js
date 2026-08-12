import { damageImageKeys } from '../hooks/damageImageKeys';
import { inspectionKeys } from '../hooks/inspectionKeys';
import { quoteKeys } from '../hooks/quoteKeys';
import { paymentKeys } from '../hooks/paymentKeys';
import { repairKeys } from '../hooks/repairKeys';

// Drops every request-specific private query branch for a just-deleted request
// from the TanStack Query cache (Phase 6.5 Unit 8, Fix 1). removeQueries (not
// invalidateQueries) is deliberate: the damage-image and repair caches carry
// short-lived signed Storage read URLs, and those must disappear from memory
// immediately for a request that no longer exists - not merely be marked stale
// and left sitting in the cache until a refetch that will never happen.
//
// Reuses the existing per-request key factories verbatim (never invents a
// duplicate key shape), including the request-detail cache keyed ['repair-requests',
// requestId]. The caller refreshes the My Requests list separately - that list
// is a fresh fetch, not request-specific private data, so it is invalidated
// rather than removed.
export function removeDeletedRequestCaches(queryClient, requestId) {
    queryClient.removeQueries({ queryKey: ['repair-requests', requestId] });
    queryClient.removeQueries({ queryKey: damageImageKeys.request(requestId) });
    queryClient.removeQueries({ queryKey: inspectionKeys.request(requestId) });
    queryClient.removeQueries({ queryKey: quoteKeys.request(requestId) });
    queryClient.removeQueries({ queryKey: paymentKeys.eligibility(requestId) });
    queryClient.removeQueries({ queryKey: repairKeys.request(requestId) });
}
