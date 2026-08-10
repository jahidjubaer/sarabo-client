// Maps a delete-request API error to a safe, user-facing message. Never
// surfaces the raw server error body to the user. The server collapses every
// state-based refusal to a single 409 REQUEST_DELETE_NOT_ALLOWED code, so the
// message here explains the general situation rather than guessing which exact
// rule fired (the request has already moved past the deletable stage).
export function getDeletionErrorMessage(error) {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    switch (status) {
        case 400:
            return 'This request could not be identified. Please refresh and try again.';
        case 403:
            // Phase 8.1A: an authenticated owner whose email is unverified is
            // blocked with the canonical EMAIL_NOT_VERIFIED code. (An unrelated
            // caller still receives the existence-safe 404 below, never a 403.)
            if (code === 'EMAIL_NOT_VERIFIED') {
                return 'Please verify your email address before deleting this request.';
            }
            return 'You are not authorized to delete this request.';
        case 404:
            // Owner-or-admin deletion returns 404 both for a truly missing
            // request and for a caller with no authority over it - the same
            // safe, non-revealing message covers both.
            return 'This repair request could not be found.';
        case 409:
            return 'This request can no longer be deleted - it has already progressed beyond a new request. You can cancel it instead, or contact support if it has been paid.';
        default:
            return 'Something went wrong deleting your request. Please try again.';
    }
}
