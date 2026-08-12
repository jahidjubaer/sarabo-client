// Pure repair-form helpers (Phase 6.4 Unit 7). No React, no network - the one
// place the technician's progress + completion client-side validation and
// request-payload shapes live, so they can be exercised directly under Node.
// The server (sarabo-server utils/repair.js) is always the real authority; this
// only gives friendly feedback and builds explicit, whitelisted payloads.

export const PROGRESS_MESSAGE_MIN = 5;
export const PROGRESS_MESSAGE_MAX = 500;
export const COMPLETION_SUMMARY_MIN = 10;
export const COMPLETION_SUMMARY_MAX = 2000;
export const MIN_EVIDENCE_IMAGES = 1;
export const MAX_EVIDENCE_IMAGES = 3;

function trimmed(value) {
    return typeof value === 'string' ? value.trim() : '';
}

export function validateProgressMessage(message) {
    const len = trimmed(message).length;
    if (len < PROGRESS_MESSAGE_MIN || len > PROGRESS_MESSAGE_MAX) {
        return { valid: false, message: `Enter ${PROGRESS_MESSAGE_MIN}-${PROGRESS_MESSAGE_MAX} characters.` };
    }
    return { valid: true };
}

// Whitelisted progress payload - only the message is ever sent. The id,
// timestamp, and technician identity are always server-generated.
export function buildProgressPayload(values) {
    return { message: trimmed(values.message) };
}

export function validateCompletion(values) {
    const errors = {};
    const summaryLen = trimmed(values.summary).length;
    if (summaryLen < COMPLETION_SUMMARY_MIN || summaryLen > COMPLETION_SUMMARY_MAX) {
        errors.summary = `Enter ${COMPLETION_SUMMARY_MIN}-${COMPLETION_SUMMARY_MAX} characters.`;
    }
    // Completion photos are OPTIONAL in the current local release (cloud object
    // storage is not provisioned): 0 photos is valid. Only the upper bound and
    // uniqueness are still enforced here; the server (utils/repair.js) remains
    // the authority. The uploader component itself is untouched.
    const ids = Array.isArray(values.evidenceImageIds) ? values.evidenceImageIds : [];
    if (ids.length > MAX_EVIDENCE_IMAGES) {
        errors.evidenceImageIds = `Attach at most ${MAX_EVIDENCE_IMAGES} completion photo${MAX_EVIDENCE_IMAGES > 1 ? 's' : ''}.`;
    } else if (new Set(ids).size !== ids.length) {
        errors.evidenceImageIds = 'Each completion photo must be unique.';
    }
    return { valid: Object.keys(errors).length === 0, errors };
}

// Whitelisted completion payload - only the summary and the server-issued
// evidence image ids. Never a storageKey, url, status, or timestamp.
export function buildCompletionPayload(values) {
    return {
        summary: trimmed(values.summary),
        evidenceImageIds: Array.isArray(values.evidenceImageIds) ? [...values.evidenceImageIds] : [],
    };
}
