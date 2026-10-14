// Repair warranty endpoints (sarabo-server routes/warranty.js). Each function
// takes the caller's axiosSecure instance, like the other api modules.
import { uploadFileToSignedUrl } from './damageImages';

export async function getWarranty(axiosSecure, requestId) {
    return (await axiosSecure.get(`/repair-requests/${requestId}/warranty`)).data;
}

// Uploads one photo for a claim and returns its photo id.
export async function uploadClaimPhoto(axiosSecure, requestId, file) {
    const { photoId, upload } = (await axiosSecure.post(`/repair-requests/${requestId}/warranty/photos`, {
        fileName: file.name || 'photo.jpg', mimeType: file.type, size: file.size,
    })).data;
    await uploadFileToSignedUrl(upload, file);
    return photoId;
}

export async function openClaim(axiosSecure, requestId, { kind, description, photoIds }) {
    return (await axiosSecure.post(`/repair-requests/${requestId}/warranty-claims`, { kind, description, photoIds })).data;
}

export async function confirmFix(axiosSecure, claimId, { fixed, note }) {
    return (await axiosSecure.post(`/warranty-claims/${claimId}/confirm`, { fixed, note })).data;
}

export async function requestReview(axiosSecure, claimId, { note }) {
    return (await axiosSecure.post(`/warranty-claims/${claimId}/review-request`, { note })).data;
}

export async function listTechnicianClaims(axiosSecure) {
    return (await axiosSecure.get('/technician/warranty-claims')).data;
}

export async function scheduleInspection(axiosSecure, claimId, { visitAt, note }) {
    return (await axiosSecure.post(`/warranty-claims/${claimId}/schedule`, { visitAt, note })).data;
}

export async function decideClaim(axiosSecure, claimId, { covered, reason, note }) {
    return (await axiosSecure.post(`/warranty-claims/${claimId}/decision`, { covered, reason, note })).data;
}

export async function reportRerepair(axiosSecure, claimId, { outcome, note }) {
    return (await axiosSecure.post(`/warranty-claims/${claimId}/rerepair`, { outcome, note })).data;
}

export async function listAdminClaims(axiosSecure, status) {
    return (await axiosSecure.get('/admin/warranty-claims', { params: { status } })).data;
}

export async function reviewClaim(axiosSecure, claimId, { decision, note }) {
    return (await axiosSecure.post(`/admin/warranty-claims/${claimId}/review`, { decision, note })).data;
}

// An admin taking over a technician step that is late.
export async function adminDecideClaim(axiosSecure, claimId, { covered, reason, note }) {
    return (await axiosSecure.post(`/admin/warranty-claims/${claimId}/decision`, { covered, reason, note })).data;
}

export async function adminCannotFix(axiosSecure, claimId, { note }) {
    return (await axiosSecure.post(`/admin/warranty-claims/${claimId}/cannot-fix`, { note })).data;
}

export async function refundClaim(axiosSecure, claimId) {
    return (await axiosSecure.post(`/admin/warranty-claims/${claimId}/refund`)).data;
}
