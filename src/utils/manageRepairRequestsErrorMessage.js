// Maps an admin request-list API error to a safe, user-facing message.
// Never surface the raw server error body to the admin.
export function getManageRepairRequestsErrorMessage(error) {
    const status = error?.response?.status;

    if (!error?.response) {
        return 'Could not reach the server. Please check your connection and try again.';
    }

    switch (status) {
        case 401:
            return 'Your session has expired. Please log in again.';
        case 403:
            return 'You are not authorized to view repair requests.';
        case 400:
            return 'Some of your search or filter values were invalid. Please adjust them and try again.';
        default:
            return 'Something went wrong loading repair requests. Please try again.';
    }
}
