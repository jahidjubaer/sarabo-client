import { useEffect, useId, useRef, useState } from 'react';
import { Camera, ImagePlus, Upload, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ALLOWED_DAMAGE_IMAGE_MIME_TYPES, MAX_DAMAGE_IMAGE_SIZE_BYTES, validateDamageImageBatch } from '../../utils/damageImageValidation';

const ACCEPT_ATTR = ALLOWED_DAMAGE_IMAGE_MIME_TYPES.join(',');
const MAX_SIZE_MB = Math.round(MAX_DAMAGE_IMAGE_SIZE_BYTES / (1024 * 1024));

const signatureOf = (file) => `${file.name}:${file.size}:${file.lastModified}`;
const toStaged = (file) => ({ key: `${signatureOf(file)}:${Math.random().toString(36).slice(2)}`, file, url: URL.createObjectURL(file) });

// Native, accessible file input (Phase 6.4 Unit 3) redesigned to the design
// system in Phase 7.6A. Chosen photos are held here with a preview and only
// go to onFilesSelected when the customer presses Upload, so a wrong pick can
// be removed before anything is sent. Validation is the same
// validateDamageImageBatch gate, counting the photos already waiting here.
//
// `initialFiles` (optional) start out waiting here, e.g. the photo the
// customer already gave the AI helper on the create form.
const DamageImagePicker = ({ existingCount, maxImages, disabled, onFilesSelected, initialFiles }) => {
    const inputId = useId();
    const [rejections, setRejections] = useState([]);
    const [staged, setStaged] = useState(() => validateDamageImageBatch(initialFiles || [], existingCount).accepted.map(toStaged));
    const stagedRef = useRef(staged);
    useEffect(() => { stagedRef.current = staged; }, [staged]);
    const remaining = Math.max(maxImages - existingCount - staged.length, 0);

    useEffect(() => () => stagedRef.current.forEach((item) => URL.revokeObjectURL(item.url)), []);

    const handleChange = (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (files.length === 0) return;
        const waiting = new Set(staged.map((item) => signatureOf(item.file)));
        const fresh = files.filter((file) => !waiting.has(signatureOf(file)));
        const duplicates = files.filter((file) => waiting.has(signatureOf(file)))
            .map((file) => ({ file, code: 'DUPLICATE_IN_BATCH', message: 'This file was already selected.' }));
        const { accepted, rejected } = validateDamageImageBatch(fresh, existingCount + staged.length);
        setRejections([...duplicates, ...rejected]);
        if (accepted.length > 0) setStaged((current) => [...current, ...accepted.map(toStaged)]);
    };

    const removeStaged = (key) => {
        setStaged((current) => current.filter((item) => {
            if (item.key === key) URL.revokeObjectURL(item.url);
            return item.key !== key;
        }));
    };

    const uploadStaged = () => {
        if (staged.length === 0) return;
        onFilesSelected(staged.map((item) => item.file));
        staged.forEach((item) => URL.revokeObjectURL(item.url));
        setStaged([]);
        setRejections([]);
    };

    if (remaining <= 0 && staged.length === 0) {
        return <p className="text-sm text-ds-muted-foreground">You've reached the maximum of {maxImages} photos for this request.</p>;
    }

    return (
        <div className="rounded-ds-lg border border-dashed border-ds-border bg-ds-muted/30 p-4">
            <span className="flex items-center gap-2 text-sm font-medium text-ds-foreground">
                <Camera aria-hidden="true" className="size-4 text-ds-primary" /> Add damage photos
            </span>
            <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ds-muted-foreground">
                JPEG, PNG, or WebP - up to {MAX_SIZE_MB} MB each. {remaining} of {maxImages} remaining.
            </p>

            {staged.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-3" aria-label="Photos ready to upload">
                    {staged.map((item) => (
                        <li key={item.key} className="relative">
                            <img src={item.url} alt={item.file.name || 'Selected photo'} className="size-24 rounded-ds border border-ds-border object-cover" />
                            <button
                                type="button"
                                onClick={() => removeStaged(item.key)}
                                disabled={disabled}
                                aria-label={`Remove ${item.file.name || 'photo'}`}
                                className="focus-ring group absolute -right-3 -top-3 flex size-11 items-center justify-center rounded-full disabled:opacity-50"
                            >
                                <span className="flex size-7 items-center justify-center rounded-full bg-ds-destructive text-ds-destructive-foreground shadow-sm group-hover:opacity-90">
                                    <X aria-hidden="true" className="size-4" />
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {remaining > 0 && (
                    <label
                        htmlFor={inputId}
                        className={`focus-within:ring-2 focus-within:ring-ds-ring inline-flex cursor-pointer items-center gap-2 rounded-ds border border-ds-border bg-ds-card px-3 py-2 text-sm font-medium text-ds-foreground hover:bg-ds-muted/40 ${disabled ? 'pointer-events-none opacity-50' : ''}`}
                    >
                        <ImagePlus aria-hidden="true" className="size-4" /> {staged.length > 0 ? 'Choose more' : 'Choose photos'}
                        <input
                            id={inputId}
                            type="file"
                            accept={ACCEPT_ATTR}
                            multiple
                            disabled={disabled}
                            onChange={handleChange}
                            aria-describedby={`${inputId}-hint`}
                            className="sr-only"
                        />
                    </label>
                )}
                {staged.length > 0 && (
                    <Button type="button" onClick={uploadStaged} disabled={disabled}>
                        <Upload aria-hidden="true" className="size-4" /> Upload {staged.length} {staged.length === 1 ? 'photo' : 'photos'}
                    </Button>
                )}
            </div>
            {staged.length > 0 && (
                <p className="mt-2 text-xs text-ds-muted-foreground">Not sent yet - check the photos, then press Upload.</p>
            )}

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
