import { getRequestStatus, getProductSummary } from './customerRequestPresentation';
import { getStatusPresentation } from '../config/statusPresentation';
import { getSpineModel } from './repairStage';

// Technician-facing, PRESENTATION-ONLY helpers for the redesigned technician
// dashboard + Assigned Jobs (Phase 7.4). Everything is derived from the data
// the assigned-jobs API already returns (GET /repair-requests/technician). No new endpoints,
// no changes to assignment / eligibility / status semantics. Reuses the generic
// request-identity + status helpers from customerRequestPresentation.

// Statuses where the TECHNICIAN has a direct next action. Deliberately excludes
// quote_submitted / quote_approved (the customer must decide / pay - the
// technician is only waiting). repair_in_progress lives in its own "In Repair"
// group rather than here, so the groups never overlap. quote_rejected is here
// because the technician must revise the quote or cancel the job - it is the
// only way out of that state, and the job keeps their active-assignment slot.
const NEEDS_ATTENTION_STATUSES = new Set([
    'assignment_pending',
    'driver_assigned',
    'rider_arriving',
    'parcel_picked_up',
    'inspection_completed',
    'quote_rejected',
    'payment_completed',
]);

// Non-overlapping technician groups.
const STATUS_GROUP = {
    // Phase 8.2: an offered-but-undecided assignment needs the technician's
    // decision, so it belongs in "Needs Attention".
    'assignment_pending': 'needs-attention',
    'driver_assigned': 'needs-attention',
    'rider_arriving': 'needs-attention',
    'parcel_picked_up': 'needs-attention',
    'inspection_completed': 'needs-attention',
    'payment_completed': 'needs-attention',
    'quote_submitted': 'waiting',
    'quote_approved': 'waiting',
    'quote_rejected': 'needs-attention',
    'pending-pickup': 'waiting',
    'repair_in_progress': 'in-repair',
    'repair_completed': 'completed',
    'parcel_delivered': 'completed',
    'cancelled': 'completed',
};

export const JOB_GROUPS = ['all', 'needs-attention', 'in-repair', 'waiting', 'completed'];
export const JOB_GROUP_LABELS = { all: 'All', 'needs-attention': 'Needs you', 'in-repair': 'In repair', waiting: 'Waiting', completed: 'Completed' };
export const JOB_SORT_OPTIONS = [
    { value: 'priority', label: 'Most urgent first' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
];

export function getJobGroup(job) {
    return STATUS_GROUP[getRequestStatus(job)] || 'waiting';
}

export function isV2Job(job) {
    return job?.schemaVersion === 2;
}

// Per-status CTA descriptor. Phase 7.6 relocated the early generic-status
// advance (driver_assigned / rider_arriving) into the repair workspace, so those
// now NAVIGATE to the job details screen where the advance control lives - the
// list no longer mutates status inline for them. Only legacy pickup completion
// remains an inline advance (legacy requests have no v2 workspace section for
// it). Every v2 workflow status navigates to the authoritative details screen;
// this helper never mutates inspection/quote/repair state.
//   kind: 'advance' -> calls the status mutation with `nextStatus`
//   kind: 'navigate' -> links to `to`
export function getTechnicianAction(job) {
    const status = getRequestStatus(job);
    const to = job?._id ? `/dashboard/assigned-jobs/${job._id}` : '/dashboard/assigned-jobs';
    const v2 = isV2Job(job);

    switch (status) {
        case 'assignment_pending':
            // The accept/reject decision lives in the details workspace.
            return { kind: 'navigate', label: 'Review assignment', to, variant: 'default' };
        case 'driver_assigned':
            return { kind: 'navigate', label: 'Start pickup', to, variant: 'default' };
        case 'rider_arriving':
            return { kind: 'navigate', label: 'Device received', to, variant: 'default' };
        case 'parcel_picked_up':
            // v2 -> inspect at details; legacy -> complete via the generic status.
            return v2
                ? { kind: 'navigate', label: 'Inspect device', to, variant: 'default' }
                : { kind: 'advance', label: 'Complete repair', nextStatus: 'parcel_delivered', variant: 'default' };
        case 'inspection_completed':
            return { kind: 'navigate', label: 'Prepare quote', to, variant: 'default' };
        case 'quote_rejected':
            // Revise / cancel lives in the details workspace.
            return { kind: 'navigate', label: 'Revise or cancel', to, variant: 'default' };
        case 'quote_submitted':
        case 'quote_approved':
            return { kind: 'navigate', label: 'View job', to, variant: 'outline' };
        case 'payment_completed':
            return { kind: 'navigate', label: 'Start repair', to, variant: 'default' };
        case 'repair_in_progress':
            return { kind: 'navigate', label: 'Continue repair', to, variant: 'default' };
        case 'repair_completed':
            return { kind: 'navigate', label: 'View summary', to, variant: 'outline' };
        default:
            return { kind: 'navigate', label: 'View job', to, variant: 'outline' };
    }
}

// Presentation-only attention model for Technician cards. Action availability
// still comes from the existing status-group/action helpers above; lifecycle
// exceptions come from the shared service-spine model. This adds no
// authorization or transition rule.
export function getTechnicianAttention(job) {
    const status = getRequestStatus(job);
    const presentation = getStatusPresentation(status);
    const action = getTechnicianAction(job);
    const group = getJobGroup(job);
    const spine = getSpineModel(job);
    // Only jobs waiting on the technician read as "Action required". A repair
    // already under way keeps its Continue link but is labelled as in
    // progress - a permanent alert on it trained technicians to ignore alerts.
    if (group === 'in-repair') {
        return {
            kind: 'waiting',
            eyebrow: 'In repair',
            title: presentation.label,
            description: presentation.technicianNextStep || presentation.technicianDescription,
            action,
        };
    }

    if (group === 'needs-attention') {
        return {
            kind: 'action',
            eyebrow: 'Action required',
            title: action.label,
            description: presentation.technicianNextStep || presentation.technicianDescription,
            action,
        };
    }

    if (spine.flow === 'blocked' || spine.flow === 'cancelled') {
        return {
            kind: 'blocked',
            eyebrow: 'Job update',
            title: presentation.label,
            description: presentation.technicianDescription,
            action: null,
        };
    }

    if (spine.flow === 'complete') {
        return {
            kind: 'done',
            eyebrow: 'Job update',
            title: presentation.label,
            description: presentation.technicianDescription,
            action: null,
        };
    }

    return {
        kind: 'waiting',
        eyebrow: 'No action required',
        title: presentation.label,
        description: presentation.technicianNextStep || presentation.technicianDescription,
        action: null,
    };
}

// Short, operationally-useful location (district, region) - never the full
// street address on the list (that stays in the details screen).
export function getJobLocation(job) {
    const location = job?.serviceLocation || {};
    return [location.district || job?.senderDistrict, location.region].filter(Boolean).join(', ');
}

const PRIORITY_RANK = { 'needs-attention': 0, 'in-repair': 1, 'waiting': 2, 'completed': 3 };

function byNewest(a, b) {
    return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
}

function byOldest(a, b) {
    return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
}

// Priority order: needs-attention, in-repair, waiting, completed. Within
// needs-attention, new assignment offers come first (they are time-sensitive
// and hold the request until answered), then the rest oldest first, so work
// is handled in the order it arrived. Every other group is newest first.
function comparePriority(a, b) {
    const rank = PRIORITY_RANK[getJobGroup(a)] - PRIORITY_RANK[getJobGroup(b)];
    if (rank !== 0) return rank;
    if (getJobGroup(a) === 'needs-attention') {
        const offerA = getRequestStatus(a) === 'assignment_pending';
        const offerB = getRequestStatus(b) === 'assignment_pending';
        if (offerA !== offerB) return offerA ? -1 : 1;
        return byOldest(a, b);
    }
    return byNewest(a, b);
}

export function jobMatchesSearch(job, query) {
    const needle = (query || '').trim().toLowerCase();
    if (!needle) return true;
    const { device, category, brandModel } = getProductSummary(job);
    const location = job?.serviceLocation || {};
    const haystack = [device, category, brandModel, job?.trackingId, location.district || job?.senderDistrict, location.region]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return haystack.includes(needle);
}

// Pure filter + sort pipeline over already-loaded jobs. Priority (default)
// follows comparePriority above.
export function applyJobView(jobs, { search = '', group = 'all', sort = 'priority' } = {}) {
    let list = (Array.isArray(jobs) ? jobs : []).filter((job) => jobMatchesSearch(job, search));
    if (group !== 'all') {
        list = list.filter((job) => getJobGroup(job) === group);
    }
    if (sort === 'newest') {
        list = [...list].sort(byNewest);
    } else if (sort === 'oldest') {
        list = [...list].sort(byOldest);
    } else {
        list = [...list].sort(comparePriority);
    }
    return list;
}
