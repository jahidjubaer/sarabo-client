// Pure presentation + privacy helpers for the public repair-tracking page
// (Phase 7.9). The public endpoint (GET /public/trackings/:code) is the
// sanitized, unauthenticated contract; this module builds the view model by
// an explicit whitelist so that even if the server response were to include
// extra fields, the public UI can only ever render the four public-safe ones.
// Statuses are always mapped through the single canonical label helper - no
// raw status string is ever surfaced.

import { getRepairStatusLabel } from './repairStatus';

// Matches the server's tracking-code format guard - used only for immediate
// client-side feedback on an obviously invalid submission, never to decide
// whether the request exists.
export const TRACKING_CODE_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

export function isValidTrackingCode(code) {
    return TRACKING_CODE_PATTERN.test((typeof code === 'string' ? code : '').trim());
}

// Explicit whitelist - NEVER spreads the raw response. Only trackingCode,
// a status label, updatedAt, and a timeline of { timestamp, statusLabel } are
// exposed. Any customer name/email/address/technician-id/quote/payment/notes
// field the server might ever return is structurally dropped here.
export function buildPublicTrackingModel(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const timelineSrc = Array.isArray(raw.timeline) ? raw.timeline : [];
    return {
        trackingCode: typeof raw.trackingCode === 'string' ? raw.trackingCode : '',
        statusLabel: getRepairStatusLabel(raw.currentStatus),
        updatedAt: raw.updatedAt || null,
        timeline: timelineSrc.map((entry) => ({
            timestamp: entry?.timestamp || null,
            statusLabel: getRepairStatusLabel(entry?.status),
        })),
    };
}

// Maps a tracking error to safe, human-facing copy (mirrors the page's prior
// status-based mapping). Never surfaces a raw Axios/server/Mongo message, and
// does not leak existence distinctions beyond the not-found default.
export function getTrackingErrorCopy(error) {
    const status = error?.response?.status;
    if (status === 429) {
        return { title: 'Too many requests', message: 'Please wait a moment before trying again.' };
    }
    if (!status || status >= 500) {
        return { title: 'We could not load your repair tracking', message: 'This looks temporary — please try again in a moment.' };
    }
    return { title: 'Tracking code not found', message: 'We could not find that tracking code. Please check it and try again.' };
}
