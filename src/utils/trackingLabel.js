import { humanizeStatus } from './statusBadge';

// Tracking log "details" strings are authored server-side (middleware/logging.js
// stores raw status text with underscores replaced by spaces) and still carry
// old delivery-domain phrasing. This is a display-only translation for known
// values; it never touches the stored log or the backend that writes it.
const TRACKING_LABELS = {
    'driver assigned': 'Technician Assigned',
    'rider arriving': 'Technician Arriving',
    'parcel picked up': 'Service Visit Started',
    'parcel delivered': 'Repair Completed',
    'pending pickup': 'Awaiting Technician',
    'in delivery': 'Repair in Progress',
};

export const formatTrackingLabel = details => {
    if (!details) return 'Unknown';
    const normalized = details.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
    return TRACKING_LABELS[normalized] || humanizeStatus(details);
};
