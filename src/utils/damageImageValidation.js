// Client-side visibility/UX heuristics only (Phase 6.4 Unit 3) - the server
// (sarabo-server's utils/damageUpload.js + utils/repairRequestV2.js) remains
// authoritative and re-validates every one of these rules itself. Mirrors
// the server's exact constants so a rejection here matches what the server
// would say anyway, rather than drifting from it.

export const ALLOWED_DAMAGE_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_DAMAGE_IMAGE_SIZE_BYTES = 8388608; // 8 MB
export const MAX_DAMAGE_IMAGES = 3;

// Mirrors src/utils/cancellationEligibility.js#canCancelRequest's own
// "pending-pickup, no assigned technician" heuristic - the server's own
// authority (utils/damageUpload.js#isDamageEvidenceEditable) checks the
// same two fields. Never trusted as the final word: a stale client guess
// here just means the server responds DAMAGE_IMAGES_LOCKED, handled
// gracefully by the upload/removal flow.
export function canEditDamageImages(request) {
    const status = request?.deliveryStatus || 'pending-pickup';
    return status === 'pending-pickup' && !request?.riderId && !request?.riderEmail;
}

function validateSingleFile(file, existingCount) {
    if (!file) {
        return { valid: false, code: 'INVALID_FILE_NAME', message: 'No file selected.' };
    }
    if (!ALLOWED_DAMAGE_IMAGE_MIME_TYPES.includes(file.type)) {
        return { valid: false, code: 'INVALID_DAMAGE_IMAGE_MIME', message: 'Only JPEG, PNG, or WebP photos are allowed.' };
    }
    if (!Number.isFinite(file.size) || file.size <= 0) {
        return { valid: false, code: 'INVALID_DAMAGE_IMAGE_SIZE', message: 'This file appears to be empty.' };
    }
    if (file.size > MAX_DAMAGE_IMAGE_SIZE_BYTES) {
        return { valid: false, code: 'INVALID_DAMAGE_IMAGE_SIZE', message: 'Each photo must be 8 MB or smaller.' };
    }
    if (existingCount >= MAX_DAMAGE_IMAGES) {
        return { valid: false, code: 'DAMAGE_IMAGE_LIMIT_REACHED', message: `You can attach at most ${MAX_DAMAGE_IMAGES} photos.` };
    }
    return { valid: true };
}

// Splits a raw FileList/array into accepted files (in original order) and
// rejected entries with a reason - never throws, so the caller can always
// show every rejection inline rather than aborting the whole selection.
// `existingCount` is the number of images already finalized on the request
// (queued-but-not-yet-finalized local items are the caller's own concern to
// add on top before calling this, via `existingCount`).
export function validateDamageImageBatch(files, existingCount) {
    const accepted = [];
    const rejected = [];
    const seenSignatures = new Set();
    let runningCount = existingCount;

    for (const file of Array.from(files || [])) {
        const signature = `${file.name}:${file.size}:${file.lastModified}`;
        if (seenSignatures.has(signature)) {
            rejected.push({ file, code: 'DUPLICATE_IN_BATCH', message: 'This file was already selected.' });
            continue;
        }
        const result = validateSingleFile(file, runningCount);
        if (!result.valid) {
            rejected.push({ file, code: result.code, message: result.message });
            continue;
        }
        seenSignatures.add(signature);
        accepted.push(file);
        runningCount += 1;
    }

    return { accepted, rejected };
}
