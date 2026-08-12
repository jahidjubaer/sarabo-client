// Pure quote-form helpers (Phase 6.4 Unit 5). No React, no network - the one
// place the technician quote form's client-side validation and request-payload
// shape live, so they can be exercised directly under Node. The server
// (sarabo-server utils/quote.js) is always the real authority: it recomputes
// the total and owns the currency; this only gives friendly feedback and a
// local total preview, and builds an explicit, whitelisted payload.

export const MAX_LINE_AMOUNT_BDT = 500000;
export const NOTES_MAX = 1000;
export const DECISION_REASON_MIN = 5;
export const DECISION_REASON_MAX = 1000;

function isBlank(value) {
    return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

// Parses a whole-taka amount input. Returns { ok, value }. A blank optional
// field yields 0; a blank required field is invalid. Rejects decimals,
// negatives, non-numeric text, operator objects, and out-of-range values.
export function parseAmount(raw, { required = false } = {}) {
    if (isBlank(raw)) {
        return required ? { ok: false } : { ok: true, value: 0 };
    }
    const str = String(raw).trim();
    if (!/^\d+$/.test(str)) return { ok: false };
    const num = Number(str);
    if (!Number.isInteger(num) || num < 0 || num > MAX_LINE_AMOUNT_BDT) return { ok: false };
    return { ok: true, value: num };
}

// Local UX-only total preview. Returns an integer, or null when any line item
// is not yet valid. The server always recomputes the authoritative total.
export function computeTotal(values) {
    const labor = parseAmount(values.laborAmount, { required: true });
    const parts = parseAmount(values.partsAmount, { required: true });
    const additional = parseAmount(values.additionalCharges);
    if (!labor.ok || !parts.ok || !additional.ok) return null;
    return labor.value + parts.value + additional.value;
}

export function validateQuoteForm(values) {
    const errors = {};
    if (!parseAmount(values.laborAmount, { required: true }).ok) {
        errors.laborAmount = `Enter a whole number of taka (0-${MAX_LINE_AMOUNT_BDT}).`;
    }
    if (!parseAmount(values.partsAmount, { required: true }).ok) {
        errors.partsAmount = `Enter a whole number of taka (0-${MAX_LINE_AMOUNT_BDT}).`;
    }
    if (!parseAmount(values.additionalCharges).ok) {
        errors.additionalCharges = `Enter a whole number of taka (0-${MAX_LINE_AMOUNT_BDT}) or leave blank.`;
    }
    if (!isBlank(values.notes) && values.notes.trim().length > NOTES_MAX) {
        errors.notes = `Notes must be ${NOTES_MAX} characters or fewer.`;
    }
    return { valid: Object.keys(errors).length === 0, errors };
}

// Builds the exact server payload via an explicit whitelist - never spreads the
// form object, so no injected key (a MongoDB operator, or an authority field
// like totalAmount/currency/status/technicianId) can reach the request body. The
// total and currency are deliberately never sent: the server owns them.
export function buildQuotePayload(values) {
    const payload = {
        laborAmount: parseAmount(values.laborAmount, { required: true }).value,
        partsAmount: parseAmount(values.partsAmount, { required: true }).value,
        additionalCharges: parseAmount(values.additionalCharges).value,
    };
    if (!isBlank(values.notes)) payload.notes = values.notes.trim();
    return payload;
}

// Validates a rejection reason (required, length-bounded). Approval needs no
// reason.
export function validateRejectionReason(reason) {
    if (isBlank(reason) || reason.trim().length < DECISION_REASON_MIN || reason.trim().length > DECISION_REASON_MAX) {
        return { valid: false, message: `Please give a reason (${DECISION_REASON_MIN}-${DECISION_REASON_MAX} characters).` };
    }
    return { valid: true };
}
