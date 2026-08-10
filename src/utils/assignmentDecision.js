// Pure client helpers for the technician assignment-decision workflow (Phase
// 8.2). Presentation + local validation only - the server (accept/reject
// endpoints) is authoritative for every transition and re-validates the reason.

export const REJECTION_REASON_MIN = 5;
export const REJECTION_REASON_MAX = 500;

// True when a request is offered to a technician and awaiting their decision.
export function isAssignmentDecisionPending(request) {
    return (request?.deliveryStatus || '') === 'assignment_pending';
}

// Mirrors the server's rejection-reason bounds (utils/assignmentDecision.js) so
// the technician gets immediate inline feedback; the server re-validates.
// Returns { valid, message } (message present only when invalid).
export function validateRejectionReason(raw) {
    const reason = typeof raw === 'string' ? raw.trim() : '';
    if (reason.length === 0) {
        return { valid: false, message: 'Please provide a reason for rejecting this assignment.' };
    }
    if (reason.length < REJECTION_REASON_MIN || reason.length > REJECTION_REASON_MAX) {
        return { valid: false, message: `Reason must be ${REJECTION_REASON_MIN}-${REJECTION_REASON_MAX} characters.` };
    }
    return { valid: true };
}

// Maps an accept/reject API error to a safe, human-facing message - never a raw
// server/Mongo string. Recognizes the canonical Phase 8.2 codes.
export function getAssignmentDecisionErrorMessage(error) {
    const code = error?.response?.data?.code;
    switch (code) {
        case 'ASSIGNMENT_ALREADY_DECIDED':
            return 'This assignment has already been decided.';
        case 'ASSIGNMENT_NOT_PENDING':
            return 'This assignment is no longer awaiting a decision.';
        case 'NOT_ASSIGNED_TECHNICIAN':
            return 'You are not the technician assigned to this request.';
        case 'INVALID_REJECTION_REASON':
            return 'Please provide a valid rejection reason.';
        default:
            return 'Could not complete the assignment decision. Please try again.';
    }
}
