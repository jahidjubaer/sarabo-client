// Repair-workspace, PRESENTATION-ONLY helpers (Phase 7.6). Derives the viewer
// role, the technician's early status-advance target, the stage rank, and
// which workflow sections apply - all from the
// request's deliveryStatus/schemaVersion. No business rules, no API changes;
// eligibility/authority stay server-side and the caller still passes the same
// role flags RequestDetails already computes.

export function isLegacyRequest(request) {
    return request?.schemaVersion !== 2;
}

export function getViewerRole({ isAssignedTechnicianView, isAdminContext, isOwner }) {
    if (isAssignedTechnicianView) return 'technician';
    if (isAdminContext) return 'admin';
    if (isOwner) return 'customer';
    return 'viewer';
}

// The technician's early generic-status advance target (the only place this
// runs is the workspace; it calls the existing PATCH /repair-requests/:id/status). Null
// when there is no early advance to make.
export function getTechnicianAdvance({ request }) {
    const status = request?.deliveryStatus || 'pending-pickup';
    const legacy = isLegacyRequest(request);
    if (status === 'driver_assigned') return { nextStatus: 'rider_arriving', label: 'Start pickup' };
    if (status === 'rider_arriving') return { nextStatus: 'parcel_picked_up', label: 'Device received' };
    if (status === 'parcel_picked_up' && legacy) return { nextStatus: 'parcel_delivered', label: 'Complete repair' };
    return null;
}

// Which workflow sections apply. Legacy requests get none of the v2 workflow
// panels (so no broken empty inspection/quote/repair cards appear).
export function getSectionVisibility({ request, isOwner, isCancelled }) {
    const isV2 = !isLegacyRequest(request);
    const status = request?.deliveryStatus || 'pending-pickup';
    return {
        showDamage: isV2,
        showInspection: isV2,
        showQuote: isV2,
        showPayment: isV2 && isOwner && !isCancelled,
        showRepair: isV2 && ['payment_completed', 'repair_in_progress', 'repair_completed', 'parcel_delivered'].includes(status),
    };
}

// How far a request has got, as a number, so a stage is shown only once it has
// been reached (no "not inspected yet" placeholders). A declined quote sits at
// the quote's rank; an unknown status counts as the start. Cancelled is not
// ranked - callers decide what a cancelled request shows.
const STATUS_RANK = {
    'pending-pickup': 0, assignment_pending: 1, driver_assigned: 2, rider_arriving: 3, parcel_picked_up: 4,
    inspection_completed: 5, quote_submitted: 6, quote_rejected: 6, quote_approved: 7, payment_completed: 8,
    repair_in_progress: 9, repair_completed: 10, parcel_delivered: 11,
};

export function getStatusRank(status) {
    return STATUS_RANK[status || 'pending-pickup'] ?? 0;
}
