import { getRequestStatus, getProductSummary } from './customerRequestPresentation';

// Technician-facing, PRESENTATION-ONLY helpers for the redesigned technician
// dashboard + Assigned Jobs (Phase 7.4). Everything is derived from the data
// the assigned-jobs API already returns (GET /parcels/rider). No new endpoints,
// no changes to assignment / eligibility / status semantics. Reuses the generic
// request-identity + status helpers from customerRequestPresentation.

// Statuses where the TECHNICIAN has a direct next action. Deliberately excludes
// quote_submitted / quote_approved (the customer must decide / pay - the
// technician is only waiting). repair_in_progress lives in its own "In Repair"
// group rather than here, so the groups never overlap.
const NEEDS_ATTENTION_STATUSES = new Set([
    'driver_assigned',
    'rider_arriving',
    'parcel_picked_up',
    'inspection_completed',
    'payment_completed',
]);

// Non-overlapping technician groups.
const STATUS_GROUP = {
    'driver_assigned': 'needs-attention',
    'rider_arriving': 'needs-attention',
    'parcel_picked_up': 'needs-attention',
    'inspection_completed': 'needs-attention',
    'payment_completed': 'needs-attention',
    'quote_submitted': 'waiting',
    'quote_approved': 'waiting',
    'quote_rejected': 'waiting',
    'pending-pickup': 'waiting',
    'repair_in_progress': 'in-repair',
    'repair_completed': 'completed',
    'parcel_delivered': 'completed',
    'cancelled': 'completed',
};

export const JOB_GROUPS = ['all', 'needs-attention', 'waiting', 'in-repair', 'completed'];
export const JOB_GROUP_LABELS = { all: 'All', 'needs-attention': 'Needs Attention', waiting: 'Waiting', 'in-repair': 'In Repair', completed: 'Completed' };
export const JOB_SORT_OPTIONS = [
    { value: 'priority', label: 'Recommended' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
];

export function getJobGroup(job) {
    return STATUS_GROUP[getRequestStatus(job)] || 'waiting';
}

export function isActionNeeded(job) {
    return NEEDS_ATTENTION_STATUSES.has(getRequestStatus(job));
}

export function isV2Job(job) {
    return job?.schemaVersion === 2;
}

// Per-status CTA descriptor. Two of these ADVANCE the generic delivery status
// via the existing PATCH /parcels/:id/status mutation - this is essential and
// intentionally preserved: reaching parcel_picked_up is the only way the
// inspection unlocks (see RequestDetails / InspectionSection), and there is no
// other place to advance it. Every other status NAVIGATES to the authoritative
// details screen; this helper never mutates inspection/quote/repair state.
//   kind: 'advance' -> calls the status mutation with `nextStatus`
//   kind: 'navigate' -> links to `to`
export function getTechnicianAction(job) {
    const status = getRequestStatus(job);
    const to = job?._id ? `/dashboard/assigned-jobs/${job._id}` : '/dashboard/assigned-jobs';
    const v2 = isV2Job(job);

    switch (status) {
        case 'driver_assigned':
            return { kind: 'advance', label: 'Start journey', nextStatus: 'rider_arriving', variant: 'default' };
        case 'rider_arriving':
            return { kind: 'advance', label: 'Start repair', nextStatus: 'parcel_picked_up', variant: 'default' };
        case 'parcel_picked_up':
            // v2 -> inspect at details; legacy -> complete via the generic status.
            return v2
                ? { kind: 'navigate', label: 'Inspect device', to, variant: 'default' }
                : { kind: 'advance', label: 'Complete repair', nextStatus: 'parcel_delivered', variant: 'default' };
        case 'inspection_completed':
            return { kind: 'navigate', label: 'Prepare quote', to, variant: 'default' };
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

export function summarizeJobs(jobs) {
    const list = Array.isArray(jobs) ? jobs : [];
    let needsAttention = 0;
    let inRepair = 0;
    let completed = 0;
    for (const job of list) {
        const group = getJobGroup(job);
        if (group === 'needs-attention') needsAttention += 1;
        else if (group === 'in-repair') inRepair += 1;
        else if (group === 'completed') completed += 1;
    }
    return { total: list.length, needsAttention, inRepair, completed };
}

// Deterministic "current/next" job: newest needs-attention, else newest
// in-repair, else newest waiting, else the newest of whatever remains.
export function selectActiveJob(jobs) {
    const list = Array.isArray(jobs) ? jobs : [];
    const pick = (predicate) => list.filter(predicate).sort(byNewest)[0];
    return (
        pick((job) => getJobGroup(job) === 'needs-attention')
        || pick((job) => getJobGroup(job) === 'in-repair')
        || pick((job) => getJobGroup(job) === 'waiting')
        || pick(() => true)
        || null
    );
}

export function getRecentJobs(jobs, count = 4) {
    return [...(Array.isArray(jobs) ? jobs : [])].sort(byNewest).slice(0, count);
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

// Pure filter + sort pipeline over already-loaded jobs. Priority (default) ranks
// action-needed first, then in-repair, then waiting, then completed; within a
// rank, newest first.
export function applyJobView(jobs, { search = '', group = 'all', sort = 'priority' } = {}) {
    let list = (Array.isArray(jobs) ? jobs : []).filter((job) => jobMatchesSearch(job, search));
    if (group !== 'all') {
        list = list.filter((job) => getJobGroup(job) === group);
    }
    if (sort === 'newest') {
        list = [...list].sort(byNewest);
    } else if (sort === 'oldest') {
        list = [...list].sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));
    } else {
        list = [...list].sort((a, b) => (PRIORITY_RANK[getJobGroup(a)] - PRIORITY_RANK[getJobGroup(b)]) || byNewest(a, b));
    }
    return list;
}
