// Maps a repair status-action (start journey / start repair / complete
// repair) API error to a safe, user-facing message. Never surface the raw
// server error body to the technician.
export function getRepairStatusActionErrorMessage(error) {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    switch (status) {
        case 400:
            return 'This repair request or status could not be identified. Please refresh and try again.';
        case 401:
            return 'Your session has expired. Please log in again.';
        case 403:
            if (code === 'NOT_ASSIGNED_TECHNICIAN') {
                return 'This repair request is not assigned to you.';
            }
            return 'You are not authorized to update this repair request.';
        case 404:
            if (code === 'TECHNICIAN_NOT_FOUND') {
                return 'The assigned technician could not be found. Please contact support.';
            }
            return 'This repair request could not be found. Please refresh the list.';
        case 409:
            if (code === 'REQUEST_NOT_ASSIGNED') {
                return 'This repair request has no assigned technician and cannot be updated.';
            }
            if (code === 'COMPLETION_CONFLICT') {
                return 'This repair request is in an inconsistent state and needs review before it can be completed. Please contact support.';
            }
            return 'This repair request can no longer be updated. Please refresh and try again.';
        default:
            return 'Something went wrong updating this repair request. Please try again.';
    }
}
