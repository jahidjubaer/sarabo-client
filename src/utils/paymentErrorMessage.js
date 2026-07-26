// Maps a checkout-session API error to a safe, user-facing message. Never
// surface the raw server error body or a Stripe internal message to the user.
export function getPaymentErrorMessage(error) {
    const status = error?.response?.status;
    switch (status) {
        case 401:
            return 'Your session has expired. Please log in again.';
        case 403:
            return 'You are not authorized to pay for this request.';
        case 404:
            return 'This repair request could not be found.';
        case 409:
            return 'This request has already been paid for.';
        case 400:
            return 'This request cannot be paid for right now. Please contact support.';
        default:
            return 'Something went wrong starting your payment. Please try again.';
    }
}
