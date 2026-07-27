// Client-side visibility heuristic only - the server
// (services/cancellationPolicy.js) remains authoritative and re-checks every
// one of these conditions itself. Mirrors that same rule: only
// pending-pickup (including a missing/legacy status, treated the same way
// everywhere else in this app), no assigned technician, and not already
// paid or cancelled.
export function canCancelRequest(request) {
    const status = request?.deliveryStatus || 'pending-pickup';
    return status === 'pending-pickup' && !request?.riderEmail && request?.paymentStatus !== 'paid';
}
