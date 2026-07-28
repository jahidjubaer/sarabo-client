// Maps a user role-update API error to a safe, user-facing message. Never
// surface the raw server error body to the admin.
export function getUserRoleUpdateErrorMessage(error) {
    const status = error?.response?.status;
    if (!status) {
        return 'Network error. Please check your connection and try again.';
    }
    switch (status) {
        case 401:
            return 'Your session has expired. Please log in again.';
        case 403:
            return 'You are not authorized to change user roles.';
        case 404:
            return 'This user could not be found. Please refresh the list.';
        default:
            return "Something went wrong updating this user's role. Please try again.";
    }
}
