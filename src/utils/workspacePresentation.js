import { getStatusPresentation } from '../config/statusPresentation';

// Repair-workspace, PRESENTATION-ONLY helpers (Phase 7.6). Derives the
// lifecycle timeline, the role-aware current-stage prompt, the technician's
// early status-advance target, and which workflow sections apply - all from the
// request's deliveryStatus/schemaVersion. No business rules, no API changes;
// eligibility/authority stay server-side and the caller still passes the same
// role flags RequestDetails already computes.

export function isLegacyRequest(request) {
    return request?.schemaVersion !== 2;
}

// Ordered lifecycle stages. Legacy (courier-era) requests use a reduced set -
// they never enter the v2 inspection/quote/repair workflow, so those stages are
// omitted rather than shown as permanently-upcoming.
const V2_STAGES = [
    { key: 'submitted', label: 'Request submitted', statuses: ['pending-pickup'] },
    // Phase 8.2: assignment_pending (a technician has been offered the request
    // but not yet accepted) keeps the "Technician assigned" stage CURRENT, not
    // completed - the acceptance is what confirms it.
    { key: 'assigned', label: 'Technician assigned', statuses: ['assignment_pending', 'driver_assigned', 'rider_arriving'] },
    { key: 'received', label: 'Device received', statuses: ['parcel_picked_up'] },
    { key: 'inspected', label: 'Inspection completed', statuses: ['inspection_completed'] },
    { key: 'quoted', label: 'Quote prepared', statuses: ['quote_submitted'] },
    { key: 'approved', label: 'Quote approved', statuses: ['quote_approved'] },
    { key: 'paid', label: 'Payment completed', statuses: ['payment_completed'] },
    { key: 'repairing', label: 'Repair in progress', statuses: ['repair_in_progress'] },
    { key: 'completed', label: 'Repair completed', statuses: ['repair_completed', 'parcel_delivered'] },
];
const LEGACY_STAGES = [
    { key: 'submitted', label: 'Request submitted', statuses: ['pending-pickup'] },
    // Legacy requests never reach assignment_pending (they assign straight to
    // driver_assigned), but including it here is harmless and keeps the stage
    // mapping identical to V2.
    { key: 'assigned', label: 'Technician assigned', statuses: ['assignment_pending', 'driver_assigned', 'rider_arriving'] },
    { key: 'received', label: 'Device received', statuses: ['parcel_picked_up'] },
    { key: 'completed', label: 'Repair completed', statuses: ['parcel_delivered'] },
];

// Returns { stages: [{ key, label, state }], exception, currentKey } where
// state ∈ completed | current | upcoming | exception, and exception ∈
// null | 'cancelled' | 'declined'. Never invents timestamps.
export function getLifecycleStages(request) {
    const legacy = isLegacyRequest(request);
    const base = legacy ? LEGACY_STAGES : V2_STAGES;
    const status = request?.deliveryStatus || 'pending-pickup';

    if (status === 'cancelled') {
        return { stages: base.map((stage) => ({ key: stage.key, label: stage.label, state: 'upcoming' })), exception: 'cancelled', currentKey: null };
    }

    if (status === 'quote_rejected') {
        const quotedIndex = base.findIndex((stage) => stage.key === 'quoted');
        return {
            stages: base.map((stage, index) => ({
                key: stage.key,
                label: stage.label,
                state: index < quotedIndex ? 'completed' : index === quotedIndex ? 'exception' : 'upcoming',
            })),
            exception: 'declined',
            currentKey: 'quoted',
        };
    }

    let currentIndex = base.findIndex((stage) => stage.statuses.includes(status));
    if (currentIndex === -1) currentIndex = 0;
    return {
        stages: base.map((stage, index) => ({
            key: stage.key,
            label: stage.label,
            state: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'upcoming',
        })),
        exception: null,
        currentKey: base[currentIndex]?.key ?? null,
    };
}

export function getViewerRole({ isAssignedTechnicianView, isAdminContext, isOwner }) {
    if (isAssignedTechnicianView) return 'technician';
    if (isAdminContext) return 'admin';
    if (isOwner) return 'customer';
    return 'viewer';
}

const TECH_WAITING_STATUSES = new Set(['quote_submitted', 'quote_approved']);
const DONE_STATUSES = new Set(['repair_completed', 'parcel_delivered']);

// Role-aware "what happens next" prompt for the current-stage panel. tone ∈
// action | waiting | done | info | neutral. Copy comes from the canonical
// status presentation - no raw statuses.
export function getWorkspaceNextStep({ request, viewerRole }) {
    const status = request?.deliveryStatus || 'pending-pickup';
    const presentation = getStatusPresentation(status);

    if (status === 'cancelled') {
        return { title: 'Request cancelled', description: presentation.customerDescription, tone: 'neutral' };
    }
    if (DONE_STATUSES.has(status)) {
        return { title: presentation.label, description: presentation.customerDescription, tone: 'done' };
    }

    if (viewerRole === 'customer') {
        if (presentation.customerNextStep) return { title: presentation.label, description: presentation.customerNextStep, tone: 'action' };
        return { title: presentation.label, description: presentation.customerDescription, tone: 'info' };
    }
    if (viewerRole === 'technician') {
        if (TECH_WAITING_STATUSES.has(status)) return { title: presentation.label, description: presentation.technicianNextStep, tone: 'waiting' };
        if (presentation.technicianNextStep) return { title: presentation.label, description: presentation.technicianNextStep, tone: 'action' };
        return { title: presentation.label, description: presentation.technicianDescription, tone: 'info' };
    }
    // admin / viewer: read-only context
    return { title: presentation.label, description: presentation.technicianDescription || presentation.customerDescription, tone: 'info' };
}

// The technician's early generic-status advance target (the only place this
// runs is the workspace; it calls the existing PATCH /parcels/:id/status). Null
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
        showRepair: isV2 && ['payment_completed', 'repair_in_progress', 'repair_completed'].includes(status),
    };
}
