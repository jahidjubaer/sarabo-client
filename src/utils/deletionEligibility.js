// Client-side visibility heuristic only - the server
// (services/deletionPolicy.js) remains authoritative and re-checks every one
// of these conditions itself before deleting anything. Deletion is only ever
// offered for a brand-new request the customer has not yet had acted on: a v2
// request still at pending-pickup (including a missing/legacy-looking status,
// treated the same way everywhere else in this app), with no assigned
// technician, no inspection, no quote, no repair, and not paid. This is
// deliberately stricter than canCancelRequest (cancellation stays available a
// little longer) - anything past the very first stage should be cancelled, not
// hard-deleted.
export function canDeleteRequest(request) {
    if (!request) return false;
    const status = request.deliveryStatus || 'pending-pickup';
    return status === 'pending-pickup'
        && !request.riderEmail
        && !request.riderId
        && !request.inspection
        && !request.quote
        && !request.repair
        && request.paymentStatus !== 'paid';
}
