import { ALLOWED_DAMAGE_IMAGE_MIME_TYPES, MAX_DAMAGE_IMAGE_SIZE_BYTES } from './damageImageValidation';

const AI_PHOTO_MAX_SIDE = 1024;
const AI_PHOTO_QUALITY = 0.8;

// Same rules as a damage photo, so the photo can also be attached to the
// request once it is created. Returns an error message or null.
export function checkAiPhoto(file) {
    if (!file) return 'No photo selected.';
    if (!ALLOWED_DAMAGE_IMAGE_MIME_TYPES.includes(file.type)) return 'Please choose a JPEG, PNG or WebP photo.';
    if (!(file.size > 0) || file.size > MAX_DAMAGE_IMAGE_SIZE_BYTES) return 'Please choose a photo of 8 MB or less.';
    return null;
}

// Shrinks the photo to at most 1024px as a JPEG before it is sent to the AI:
// plenty to see damage, and small enough to send quickly on mobile data.
export async function shrinkPhotoForAi(file) {
    const bitmap = await createImageBitmap(file);
    try {
        const scale = Math.min(1, AI_PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff'; // transparent PNG areas become white, not black
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', AI_PHOTO_QUALITY);
        return { mimeType: 'image/jpeg', data: dataUrl.slice(dataUrl.indexOf(',') + 1) };
    } finally {
        bitmap.close?.();
    }
}
