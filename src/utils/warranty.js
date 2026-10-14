// Repair warranty labels and copy (policy: sarabo-server utils/warranty.js).

export const WARRANTY_DAYS = 30;
export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 1000;
export const NOTE_MAX = 500;

export const CLAIM_KINDS = [
    { value: 'same_fault', label: 'The same problem came back', description: 'The fault that was repaired is happening again.' },
    { value: 'part_failed', label: 'A replaced part stopped working', description: 'A part the technician fitted has failed.' },
];

export const NOT_COVERED_REASONS = [
    { value: 'new_damage', label: 'New damage' },
    { value: 'water_damage', label: 'Water damage' },
    { value: 'drop_damage', label: 'Damage from a drop' },
    { value: 'other', label: 'Other reason' },
];

// { label, tone } per claim status; tones follow the badge scale
// (attention = the viewer has to act, decided per audience below).
const STATUS = {
    submitted: { label: 'Waiting for re-inspection booking', tone: 'waiting' },
    inspection_scheduled: { label: 'Re-inspection booked', tone: 'active' },
    covered: { label: 'Covered - free re-repair', tone: 'active' },
    not_covered: { label: 'Not covered', tone: 'neutral' },
    review_requested: { label: 'Admin review requested', tone: 'waiting' },
    rejected: { label: 'Closed - not covered', tone: 'neutral' },
    fixed_pending_confirmation: { label: 'Repaired - waiting for confirmation', tone: 'active' },
    resolved: { label: 'Resolved', tone: 'success' },
    refund_pending: { label: 'Refund being processed', tone: 'waiting' },
    refunded: { label: 'Refunded', tone: 'success' },
};

// Statuses where each audience is the one who has to act next.
const ACTION_BY = {
    customer: ['fixed_pending_confirmation'],
    technician: ['submitted', 'inspection_scheduled', 'covered'],
    admin: ['review_requested', 'refund_pending'],
};

export function claimStatus(status, audience) {
    const base = STATUS[status] || { label: status, tone: 'neutral' };
    return ACTION_BY[audience]?.includes(status) ? { ...base, tone: 'attention' } : base;
}

export function kindLabel(kind) {
    return CLAIM_KINDS.find((k) => k.value === kind)?.label || kind;
}

export function reasonLabel(reason) {
    return NOT_COVERED_REASONS.find((r) => r.value === reason)?.label || reason;
}

export const CANNOT_CLAIM_COPY = {
    WARRANTY_NOT_STARTED: 'Your 30-day warranty starts when you confirm you received the repaired device.',
    WARRANTY_EXPIRED: 'The 30-day warranty for this repair has ended.',
    CLAIM_ALREADY_OPEN: 'You already have an open warranty claim on this repair.',
    CLAIM_LIMIT_REACHED: 'This repair has reached the limit of two warranty claims.',
};

export const WARRANTY_ERROR_COPY = {
    ...CANNOT_CLAIM_COPY,
    STORAGE_UNAVAILABLE: "Photos can't be uploaded right now. You can send the claim without photos.",
    PHOTO_NOT_UPLOADED: "A photo didn't finish uploading. Please remove it and add it again.",
    PHOTO_NOT_FOUND: "A photo couldn't be found. Please remove it and add it again.",
    EMAIL_NOT_VERIFIED: 'Please verify your email before opening a warranty claim.',
    INSPECTION_NOT_BOOKED: 'Book the re-inspection visit first.',
    CLAIM_ALREADY_DECIDED: 'This claim has already been decided.',
    CLAIM_ALREADY_INSPECTED: 'This claim has already been decided.',
    REVIEW_WINDOW_CLOSED: 'The 7 days to ask for a review have passed.',
    NOTE_REQUIRED: 'Please add a short explanation (at least 10 characters).',
    ALREADY_REFUNDED: 'This claim was already refunded.',
    REFUND_FAILED: 'The refund could not be completed. Nothing was refunded twice - please try again.',
};

export function warrantyErrorMessage(error, fallback) {
    const data = error?.response?.data;
    return WARRANTY_ERROR_COPY[data?.code] || data?.message || fallback;
}
