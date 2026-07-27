// Maps a raw stored deliveryStatus value (unchanged, courier-era wording) to
// the user-facing repair terminology Sarabo actually presents. Display-only:
// never alters, invents, or normalizes the underlying value used for
// filtering, API calls, or status mutations.
const REPAIR_STATUS_LABELS = {
    'pending-pickup': 'Request Submitted',
    'driver_assigned': 'Technician Assigned',
    'rider_arriving': 'Technician On The Way',
    'parcel_picked_up': 'Repair In Progress',
    'parcel_delivered': 'Repair Completed',
    'cancelled': 'Request Cancelled',
};

export function getRepairStatusLabel(status) {
    if (!status) return REPAIR_STATUS_LABELS['pending-pickup'];
    return REPAIR_STATUS_LABELS[status] || 'Unknown Repair Status';
}
