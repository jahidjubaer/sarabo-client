// Narrow client wrapper over the v2 repair workflow endpoints (Phase 6.4 Unit
// 7). All use the caller's axiosSecure (Firebase bearer token). The signed PUT
// for completion evidence reuses uploadFileToSignedUrl from the damage-image
// api unchanged (it is a generic signed-URL transport, not damage-specific).
// The client never sends a technician id, timestamp, status, storageKey, or url.
import { uploadFileToSignedUrl } from './damageImages';

export async function getRepair(axiosSecure, requestId) {
    const res = await axiosSecure.get(`/repair-requests/${requestId}/repair`);
    return res.data.repair;
}

export async function startRepair(axiosSecure, requestId) {
    const res = await axiosSecure.post(`/repair-requests/${requestId}/repair/start`, {});
    return res.data;
}

export async function addProgress(axiosSecure, requestId, payload) {
    const res = await axiosSecure.post(`/repair-requests/${requestId}/repair/progress`, payload);
    return res.data;
}

export async function completeRepair(axiosSecure, requestId, payload) {
    const res = await axiosSecure.post(`/repair-requests/${requestId}/repair/complete`, payload);
    return res.data;
}

// Two-step evidence upload: create a signed PUT session, then PUT the file
// bytes straight to storage (never through the Sarabo API). Returns the
// server-issued uploadSessionId, which is the evidenceImageId completion later
// references.
export async function uploadRepairEvidence(axiosSecure, requestId, file) {
    const res = await axiosSecure.post(`/repair-requests/${requestId}/repair/evidence`, {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
    });
    const { uploadSessionId, upload } = res.data;
    await uploadFileToSignedUrl(upload, file);
    return uploadSessionId;
}
