// Maps a Create Repair Request API error to a safe, user-facing message.
// Never surface the raw server, MongoDB, Axios, or Firebase error.
export function getCreateRequestErrorMessage(error) {
    const status = error?.response?.status;
    if (!status) {
        return 'Network error. Please check your connection and try again.';
    }
    switch (status) {
        case 400:
            return 'Some of the details you entered could not be accepted. Please review the form and try again.';
        case 401:
            return 'Your session has expired. Please log in again.';
        case 403:
            return 'You are not authorized to create a repair request.';
        default:
            return 'Something went wrong creating your repair request. Please try again.';
    }
}
