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
//
// Phase 8.5: general list responses no longer carry the inspection/quote/repair
// sub-documents themselves (they held technician-private and provider-internal
// data). Instead the server sends boolean existence markers hasInspection /
// hasQuote / hasRepair. This heuristic only ever cared whether each stage had
// started, so it reads those flags, falling back to the presence of the raw
// sub-document for any older payload shape that still includes it.
function stageStarted(request, flag, subdocument) {
    return request[flag] === true || Boolean(request[subdocument]);
}

export function canDeleteRequest(request) {
    if (!request) return false;
    const status = request.deliveryStatus || 'pending-pickup';
    return status === 'pending-pickup'
        && !request.technicianEmail
        && !request.technicianId
        && !stageStarted(request, 'hasInspection', 'inspection')
        && !stageStarted(request, 'hasQuote', 'quote')
        && !stageStarted(request, 'hasRepair', 'repair')
        && request.paymentStatus !== 'paid';
}
