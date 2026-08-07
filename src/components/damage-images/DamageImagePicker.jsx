import { useId, useState } from 'react';
import { Camera } from 'lucide-react';
import { ALLOWED_DAMAGE_IMAGE_MIME_TYPES, MAX_DAMAGE_IMAGE_SIZE_BYTES, validateDamageImageBatch } from '../../utils/damageImageValidation';

const ACCEPT_ATTR = ALLOWED_DAMAGE_IMAGE_MIME_TYPES.join(',');
const MAX_SIZE_MB = Math.round(MAX_DAMAGE_IMAGE_SIZE_BYTES / (1024 * 1024));

// Native, accessible file input (Phase 6.4 Unit 3) redesigned to the design
// system in Phase 7.6A. All selection/validation behaviour is unchanged - the
// same validateDamageImageBatch gate, the same onFilesSelected contract.
const DamageImagePicker = ({ existingCount, maxImages, disabled, onFilesSelected }) => {
    const inputId = useId();
    const [rejections, setRejections] = useState([]);
    const remaining = Math.max(maxImages - existingCount, 0);

    const handleChange = (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (files.length === 0) return;
        const { accepted, rejected } = validateDamageImageBatch(files, existingCount);
        setRejections(rejected);
        if (accepted.length > 0) onFilesSelected(accepted);
    };

    if (remaining <= 0) {
        return <p className="text-sm text-ds-muted-foreground">You've reached the maximum of {maxImages} photos for this request.</p>;
    }

    return (
        <div className="rounded-ds-lg border border-dashed border-ds-border bg-ds-muted/30 p-4">
            <label htmlFor={inputId} className="flex items-center gap-2 text-sm font-medium text-ds-foreground">
                <Camera aria-hidden="true" className="size-4 text-ds-primary" /> Add damage photos
            </label>
            <input
                id={inputId}
                type="file"
                accept={ACCEPT_ATTR}
                multiple
                disabled={disabled}
                onChange={handleChange}
                aria-describedby={`${inputId}-hint`}
                className="mt-2 block w-full text-sm text-ds-muted-foreground file:mr-3 file:cursor-pointer file:rounded-ds file:border-0 file:bg-ds-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-ds-primary-foreground hover:file:bg-ds-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring"
            />
            <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ds-muted-foreground">
                JPEG, PNG, or WebP - up to {MAX_SIZE_MB} MB each. {remaining} of {maxImages} remaining.
            </p>
            {rejections.length > 0 && (
                <ul className="mt-2 space-y-1" role="alert">
                    {rejections.map((rejection, index) => (
                        <li key={`${rejection.file?.name ?? 'file'}-${index}`} className="text-xs font-medium text-ds-destructive">
                            {rejection.file?.name ? `${rejection.file.name}: ` : ''}{rejection.message}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DamageImagePicker;
