// Narrow API layer for the damage-evidence upload endpoints (see
// sarabo-server's routes/damageUploads.js). Each authenticated function
// takes the caller's own axiosSecure instance rather than constructing one
// (mirrors src/api/notifications.js) - this module stays a plain, hook-free
// function set. Server response shapes are returned as-is, never wrapped or
// reshaped.
import axios from 'axios';

function assertValidRequestId(requestId) {
    if (!requestId || typeof requestId !== 'string') {
        throw new Error('A valid requestId is required');
    }
}

export async function createDamageUploadSession(axiosSecure, requestId, { fileName, mimeType, size }) {
    assertValidRequestId(requestId);
    const res = await axiosSecure.post(`/parcels/${requestId}/damage-images/upload-session`, { fileName, mimeType, size });
    return res.data;
}

export async function finalizeDamageUpload(axiosSecure, requestId, uploadSessionId) {
    assertValidRequestId(requestId);
    const res = await axiosSecure.post(`/parcels/${requestId}/damage-images/finalize`, { uploadSessionId });
    return res.data;
}

export async function getDamageImages(axiosSecure, requestId) {
    assertValidRequestId(requestId);
    const res = await axiosSecure.get(`/parcels/${requestId}/damage-images`);
    return res.data;
}

export async function removeDamageImage(axiosSecure, requestId, imageId) {
    assertValidRequestId(requestId);
    const res = await axiosSecure.delete(`/parcels/${requestId}/damage-images/${encodeURIComponent(imageId)}`);
    return res.data;
}

// Dedicated, interceptor-free axios instance for the signed GCS PUT only -
// deliberately NOT axiosSecure (which unconditionally attaches the Firebase
// bearer token to every request it makes) and deliberately its own
// axios.create() instance rather than the bare default export, so it can
// never be affected by an interceptor registered against the shared default
// instance elsewhere in the app, now or in the future. Mirrors the existing
// plain-`axios` precedent already used for the (unrelated) imgbb upload in
// src/pages/Auth/Register/Register.jsx.
const uploadTransport = axios.create();

// PUTs `file` directly to the signed URL the server returned from
// createDamageUploadSession - never through the Sarabo API, never with an
// Authorization header. Sends only the exact headers the server supplied
// (notably Content-Type, which must match what the URL was signed with).
export async function uploadFileToSignedUrl(uploadContract, file, { onProgress, signal } = {}) {
    const { method = 'PUT', url, headers } = uploadContract || {};
    if (!url) {
        throw new Error('uploadContract.url is required');
    }
    try {
        await uploadTransport.request({
            url,
            method,
            data: file,
            headers,
            signal,
            // Never let axios attempt to JSON-encode a raw File/Blob - send
            // the bytes exactly as provided.
            transformRequest: [(data) => data],
            onUploadProgress: (event) => {
                if (onProgress && event.total) {
                    onProgress(Math.round((event.loaded / event.total) * 100));
                }
            },
        });
    } catch (error) {
        // Normalized here (not left as a raw Axios error) so callers/UI
        // never need to distinguish "Sarabo API error" from "GCS transport
        // error" by shape - see src/utils/damageImageErrors.js.
        if (axios.isCancel(error) || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
            throw Object.assign(new Error('upload cancelled'), { isCancelled: true });
        }
        throw Object.assign(new Error('upload transport failed'), { isUploadTransportError: true, cause: error });
    }
}
