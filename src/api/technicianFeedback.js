// Feedback endpoints. Authentication remains in useAxiosSecure.
export async function listAdminReports(axios, params, signal) {
    return (await axios.get('/admin/technician-reports', { params, signal })).data;
}

export async function getAdminReport(axios, id, signal) {
    return (await axios.get(`/admin/technician-reports/${id}`, { signal })).data;
}

export async function updateReportStatus(axios, id, { status, expectedVersion, explanation }, signal) {
    return (await axios.patch(`/admin/technician-reports/${id}/status`, {
        status, expectedVersion, ...(explanation !== undefined ? { explanation } : {}),
    }, { signal, _retry: true })).data;
}

export async function addReportNote(axios, id, { text, expectedVersion }, signal) {
    return (await axios.post(`/admin/technician-reports/${id}/notes`, { text, expectedVersion }, { signal, _retry: true })).data;
}

export async function listAdminReviews(axios, params, signal) {
    return (await axios.get('/admin/technician-reviews', { params, signal })).data;
}

export async function updateReviewVisibility(axios, id, { visibility, reason, expectedVersion }, signal) {
    // The existing secure interceptor honors _retry. Do not replay moderation
    // writes automatically after token refresh; the Admin must review/reconfirm.
    return (await axios.patch(`/admin/technician-reviews/${id}/visibility`, { visibility, reason, expectedVersion }, { signal, _retry: true })).data;
}

export async function getRepairFeedback(axios, id, signal) {
    return (await axios.get(`/repair-requests/${id}/feedback`, { signal })).data;
}

export async function submitRepairReview(axios, id, { rating, comment }, signal) {
    return (await axios.post(`/repair-requests/${id}/review`, { rating, comment }, { signal, _retry: true })).data;
}

export async function submitTechnicianReport(axios, id, { reason, description, assignmentId }, signal) {
    return (await axios.post(`/repair-requests/${id}/technician-reports`, {
        reason, description, ...(assignmentId != null ? { assignmentId } : {}),
    }, { signal, _retry: true })).data;
}

export async function listMyTechnicianReviews(axios, { page, limit }, signal) {
    return (await axios.get('/technicians/me/reviews', { params: { page, limit }, signal })).data;
}
