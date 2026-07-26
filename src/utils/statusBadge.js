// Turns a raw stored status code into a readable label. Display-only — never
// alters, invents, or normalizes the underlying value used for filtering/API calls.
export const humanizeStatus = status => status
    ? status.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Unknown';

// DaisyUI badge class for each raw status value actually stored/used by the
// backend today (requests/jobs, technician application + work status, payments).
// Statuses not listed here (including future backend renames) safely fall back
// to a neutral badge instead of guessing a color.
const STATUS_BADGE_CLASSES = {
    // repair request / job delivery status
    'pending-pickup': 'badge-warning',
    'driver_assigned': 'badge-info',
    'rider_arriving': 'badge-accent',
    'parcel_picked_up': 'badge-accent',
    'parcel_delivered': 'badge-success',

    // technician application status
    'pending': 'badge-warning',
    'approved': 'badge-info',
    'rejected': 'badge-error',

    // technician work status
    'available': 'badge-success',
    'in_delivery': 'badge-accent',

    // payment status
    'paid': 'badge-success',
    'unpaid': 'badge-warning',
};

export const getStatusBadgeClass = status => STATUS_BADGE_CLASSES[status] || 'badge-ghost';
