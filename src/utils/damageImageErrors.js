// Maps sarabo-server's controlled damage-upload error codes (see
// sarabo-server's controllers/damageUploadController.js) to short, safe UI
// copy. Never renders a raw Axios/network error or the server's internal
// message field directly - only these fixed strings, or a generic fallback.

const SERVER_ERROR_MESSAGES = {
    INVALID_REQUEST_ID: 'This repair request is unavailable.',
    REQUEST_NOT_FOUND: 'This repair request is unavailable.',
    LEGACY_REQUEST_NOT_SUPPORTED: 'Photo upload is only available for newer repair requests.',
    DAMAGE_IMAGES_LOCKED: 'Photos can no longer be added or removed for this request.',
    INVALID_UPLOAD_REQUEST: 'Something went wrong preparing the upload. Please try again.',
    INVALID_FILE_NAME: 'That file name is not valid. Please rename the file and try again.',
    INVALID_DAMAGE_IMAGE_MIME: 'Only JPEG, PNG, or WebP photos are allowed.',
    INVALID_DAMAGE_IMAGE_SIZE: 'Each photo must be 8 MB or smaller.',
    DAMAGE_IMAGE_LIMIT_REACHED: 'You can attach at most 3 photos to this request.',
    UPLOAD_SESSION_NOT_FOUND: 'This upload is no longer valid. Please try again.',
    UPLOAD_SESSION_EXPIRED: 'This upload took too long and expired. Please try again.',
    UPLOAD_SESSION_CONFLICT: 'This upload is no longer active. Please try again.',
    UPLOAD_SESSION_ALREADY_FINALIZED: 'This photo has already been added.',
    STORAGE_OBJECT_NOT_FOUND: 'The uploaded photo could not be found. Please try again.',
    STORAGE_OBJECT_MISMATCH: 'The uploaded photo could not be verified. Please try again.',
    STORAGE_UNAVAILABLE: 'Photo storage is temporarily unavailable. Please try again shortly.',
    DAMAGE_IMAGE_ALREADY_ATTACHED: 'This photo has already been added.',
    DAMAGE_IMAGE_NOT_FOUND: 'That photo could not be found.',
};

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';
const UPLOAD_TRANSPORT_MESSAGE = 'The photo could not be uploaded. Please check your connection and try again.';

// `error` may be an Axios error (has response.data.code) or a plain Error
// thrown by the signed-PUT transport (see src/api/damageImages.js), which
// carries no server code at all.
export function normalizeDamageImageError(error) {
    const code = error?.response?.data?.code;
    if (code && SERVER_ERROR_MESSAGES[code]) {
        return { code, message: SERVER_ERROR_MESSAGES[code] };
    }
    if (error?.isUploadTransportError) {
        return { code: 'UPLOAD_TRANSPORT_FAILED', message: UPLOAD_TRANSPORT_MESSAGE };
    }
    return { code: code || 'UNKNOWN_ERROR', message: DEFAULT_MESSAGE };
}
