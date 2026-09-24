import { useId, useRef, useState } from 'react';
import { X, Plus } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { uploadRepairEvidence } from '../../api/repairs';
import { MAX_EVIDENCE_IMAGES } from '../../utils/repairForm';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Technician completion-evidence uploader (Phase 6.4 Unit 7) redesigned in 7.6A.
// Each selected image is PUT straight to storage via a server-issued signed URL
// (api/repairs.js#uploadRepairEvidence); the parent is told only the
// server-issued evidence image ids - never a storageKey/url. Object-URL
// previews are memory-only. Upload architecture is unchanged - only presentation.
const RepairCompletionEvidence = ({ requestId, items, onChange, disabled }) => {
    const axiosSecure = useAxiosSecure();
    const groupId = useId();
    const labelId = `${groupId}-evidence-label`;
    const hintId = `${groupId}-evidence-hint`;
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const atMax = items.length >= MAX_EVIDENCE_IMAGES;

    // Several photos can be picked at once. They upload one after another
    // through the same signed-URL call as before; anything past the limit, of
    // the wrong type or too large is skipped with a message.
    const onPick = async (event) => {
        const picked = Array.from(event.target.files || []);
        if (inputRef.current) inputRef.current.value = '';
        if (picked.length === 0 || uploading || atMax) return;
        const room = MAX_EVIDENCE_IMAGES - items.length;
        const valid = picked.filter((file) => ALLOWED_MIME.includes(file.type) && file.size > 0 && file.size <= MAX_SIZE_BYTES);
        const queue = valid.slice(0, room);
        const problems = [];
        if (valid.length < picked.length) problems.push('Some files were skipped: use JPG, PNG or WebP images of 5 MB or less.');
        if (valid.length > room) problems.push(`Only ${MAX_EVIDENCE_IMAGES} photos are allowed.`);
        setError('');
        if (queue.length === 0) { setError(problems.join(' ')); return; }
        setUploading(true);
        const added = [];
        for (const file of queue) {
            try {
                const imageId = await uploadRepairEvidence(axiosSecure, requestId, file);
                added.push({ imageId, previewUrl: URL.createObjectURL(file), name: file.name });
            } catch {
                problems.push(`${file.name} failed to upload. Please try again.`);
            }
        }
        if (added.length > 0) onChange([...items, ...added]);
        setError(problems.join(' '));
        setUploading(false);
    };

    const remove = (imageId) => {
        const target = items.find((item) => item.imageId === imageId);
        if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
        onChange(items.filter((item) => item.imageId !== imageId));
    };

    return (
        <div className="space-y-2">
            <span id={labelId} className="text-body-sm font-semibold leading-none text-ds-foreground">Completion photos <span className="font-normal text-ds-muted-foreground">(optional) · {items.length}/{MAX_EVIDENCE_IMAGES}</span></span>
            <p id={hintId} className="text-micro text-ds-muted-foreground">Up to {MAX_EVIDENCE_IMAGES} photos of the finished repair. JPG, PNG or WebP, 5 MB each.</p>
            <div role="group" aria-labelledby={labelId} aria-describedby={hintId} className="flex flex-wrap gap-3">
                {items.map((item) => (
                    <div key={item.imageId} className="relative">
                        <img src={item.previewUrl} alt={item.name || 'Completion evidence'} className="size-24 rounded-ds object-cover border border-ds-border" />
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => remove(item.imageId)}
                                aria-label={`Remove ${item.name || 'photo'}`}
                                className="focus-ring group absolute -right-3 -top-3 flex size-11 items-center justify-center rounded-full"
                            >
                                <span className="flex size-7 items-center justify-center rounded-full bg-ds-destructive text-ds-destructive-foreground shadow-sm group-hover:opacity-90">
                                    <X aria-hidden="true" className="size-4" />
                                </span>
                            </button>
                        )}
                    </div>
                ))}
                {!atMax && !disabled && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        aria-label={uploading ? undefined : 'Add completion photos'}
                        aria-describedby={hintId}
                        className="focus-ring flex size-24 flex-col items-center justify-center gap-1 rounded-ds border border-dashed border-ds-border text-xs text-ds-muted-foreground hover:bg-ds-muted/40 disabled:opacity-50"
                    >
                        {uploading ? 'Uploading…' : <><Plus aria-hidden="true" className="size-5" /> Add</>}
                    </button>
                )}
            </div>
            <input ref={inputRef} type="file" multiple accept={ALLOWED_MIME.join(',')} className="hidden" onChange={onPick} />
            {error && <p role="alert" className="text-xs font-medium text-ds-destructive">{error}</p>}
        </div>
    );
};

export default RepairCompletionEvidence;
