// Maps a technician-assignment API error to a safe, user-facing message.
// Never surface the raw server error body to the admin.
export function getAssignmentErrorMessage(error) {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    switch (status) {
        case 400:
            return 'This request or technician could not be identified. Please refresh and try again.';
        case 401:
            return 'Your session has expired. Please log in again.';
        case 403:
            return 'You are not authorized to assign technicians.';
        case 404:
            if (code === 'TECHNICIAN_NOT_FOUND') {
                return 'This technician could not be found. Please refresh the technician list.';
            }
            return 'This repair request could not be found. It may have been removed.';
        case 409:
            if (code === 'REQUEST_CANCELLED') {
                return 'This request was cancelled by the customer and can no longer be assigned.';
            }
            if (code === 'REQUEST_ALREADY_ASSIGNED') {
                return 'This request has already been assigned to a technician. Please refresh the list.';
            }
            if (code === 'TECHNICIAN_NOT_APPROVED') {
                return 'This technician is not approved and cannot be assigned.';
            }
            return 'This request can no longer be assigned. Please refresh and try again.';
        default:
            return 'Something went wrong assigning this technician. Please try again.';
    }
}
