// Maps a technician-application submission API error to a safe, user-facing
// message. Never surface the raw server, MongoDB, or Axios error.
export function getTechnicianApplicationErrorMessage(error) {
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
            return 'You are not authorized to submit a technician application.';
        default:
            return 'Something went wrong submitting your application. Please try again.';
    }
}
