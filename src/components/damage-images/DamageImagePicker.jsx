import { useId, useState } from 'react';
import { FaCamera } from 'react-icons/fa';
import { ALLOWED_DAMAGE_IMAGE_MIME_TYPES, MAX_DAMAGE_IMAGE_SIZE_BYTES, validateDamageImageBatch } from '../../utils/damageImageValidation';

const ACCEPT_ATTR = ALLOWED_DAMAGE_IMAGE_MIME_TYPES.join(',');
const MAX_SIZE_MB = Math.round(MAX_DAMAGE_IMAGE_SIZE_BYTES / (1024 * 1024));

// A visible, keyboard-and-screen-reader-accessible native file input
// (DaisyUI's `file-input` class, matching the only other file input in this
// codebase - see src/pages/Auth/Register/Register.jsx) rather than a
// hidden input behind a styled button, so focus/label association is never
// lost.
const DamageImagePicker = ({ existingCount, maxImages, disabled, onFilesSelected }) => {
    const inputId = useId();
    const [rejections, setRejections] = useState([]);
    const remaining = Math.max(maxImages - existingCount, 0);

    const handleChange = (event) => {
        const files = Array.from(event.target.files || []);
        // Reset the input immediately so selecting the exact same file again
        // later (e.g. after removing it) still fires a change event.
        event.target.value = '';
        if (files.length === 0) return;

        const { accepted, rejected } = validateDamageImageBatch(files, existingCount);
        setRejections(rejected);
        if (accepted.length > 0) onFilesSelected(accepted);
    };

    if (remaining <= 0) {
        return (
            <p className="text-sm opacity-70">
                You've reached the maximum of {maxImages} photos for this request.
            </p>
        );
    }

    return (
        <div>
            <label htmlFor={inputId} className="label">
                <span className="label-text flex items-center gap-2">
                    <FaCamera aria-hidden="true" /> Add damage photos
                </span>
            </label>
            <input
                id={inputId}
                type="file"
                accept={ACCEPT_ATTR}
                multiple
                disabled={disabled}
                onChange={handleChange}
                className="file-input file-input-bordered w-full"
                aria-describedby={`${inputId}-hint`}
            />
            <p id={`${inputId}-hint`} className="text-xs opacity-70 mt-1">
                JPEG, PNG, or WebP - up to {MAX_SIZE_MB} MB each. {remaining} of {maxImages} remaining.
            </p>
            {rejections.length > 0 && (
                <ul className="mt-2 space-y-1" role="alert">
                    {rejections.map((rejection, index) => (
                        <li key={`${rejection.file?.name ?? 'file'}-${index}`} className="text-sm text-error">
                            {rejection.file?.name ? `${rejection.file.name}: ` : ''}{rejection.message}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DamageImagePicker;
