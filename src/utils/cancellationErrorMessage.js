// Maps a cancel-request API error to a safe, user-facing message. Never
// surface the raw server error body to the user.
export function getCancellationErrorMessage(error) {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    switch (status) {
        case 400:
            if (code === 'INVALID_REQUEST_STATUS') {
                return 'This request is in an unrecognized state and cannot be cancelled. Please contact support.';
            }
            return 'This request cannot be cancelled right now.';
        case 403:
            return 'You are not authorized to cancel this request.';
        case 404:
            return 'This repair request could not be found.';
        case 409:
            if (code === 'REQUEST_ALREADY_ASSIGNED') {
                return 'A technician has already been assigned - this request can no longer be cancelled.';
            }
            if (code === 'REQUEST_ALREADY_PAID') {
                return 'This request has already been paid for. Please contact support for cancellation or refund options.';
            }
            return 'This request can no longer be cancelled.';
        default:
            return 'Something went wrong cancelling your request. Please try again.';
    }
}
