// Maps a technician approval/rejection API error to a safe, user-facing
// message. Never surface the raw server error body to the admin.
export function getTechnicianApprovalErrorMessage(error) {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    switch (status) {
        case 400:
            return 'This technician or status could not be identified. Please refresh and try again.';
        case 401:
            return 'Your session has expired. Please log in again.';
        case 403:
            return 'You are not authorized to update technician applications.';
        case 404:
            if (code === 'LINKED_USER_NOT_FOUND') {
                return 'This technician has no linked user account and cannot be updated. Please contact support.';
            }
            return 'This technician application could not be found. Please refresh the list.';
        case 409:
            if (code === 'LINKED_USER_ROLE_CONFLICT') {
                return 'This technician is linked to an admin account and cannot be changed here.';
            }
            if (code === 'TECHNICIAN_STATUS_CONFLICT') {
                return 'This technician application is in an inconsistent state and needs review before it can be updated. Please contact support.';
            }
            return 'This technician application can no longer be updated. Please refresh and try again.';
        default:
            return 'Something went wrong updating this technician. Please try again.';
    }
}
