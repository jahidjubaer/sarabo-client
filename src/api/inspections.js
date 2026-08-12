// Narrow client wrapper over the authenticated inspection endpoints
// (Phase 6.4 Unit 4). Both take the caller's own axiosSecure instance (which
// attaches the Firebase bearer token) - there is no signed-URL or storage
// interaction here, and no private data is persisted anywhere client-side.

export async function getInspection(axiosSecure, requestId) {
    const res = await axiosSecure.get(`/repair-requests/${requestId}/inspection`);
    // Server response shape: { inspection: { status, diagnosis, repairability,
    // estimate, submittedAt, version, internalNotes? } }. internalNotes is
    // only ever present for the admin/assigned-technician view - the server
    // decides, never the client.
    return res.data.inspection;
}

export async function submitInspection(axiosSecure, requestId, payload) {
    const res = await axiosSecure.post(`/repair-requests/${requestId}/inspection`, payload);
    // { message, deliveryStatus, inspection }
    return res.data;
}
