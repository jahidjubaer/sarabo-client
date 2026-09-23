import { getStatusPresentation } from '../config/statusPresentation';

// Maps a raw stored deliveryStatus value to the user-facing label. Display-only:
// never alters, invents, or normalizes the underlying value used for filtering,
// API calls, or status mutations.
//
// Redesign Phase 1: labels come from config/statusPresentation.js, the single
// source of truth, so the public tracking page and the dashboards always use
// the same words (this file previously said "Repair In Progress" for a
// collected device and "Quote Sent" for a ready quote).
export function getRepairStatusLabel(status) {
    return getStatusPresentation(status).label;
}
