import { useRef, useState } from 'react';
import { X, Plus } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { uploadRepairEvidence } from '../../api/repairs';
import { MAX_EVIDENCE_IMAGES } from '../../utils/repairForm';
import { Label } from '../ui/label';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Technician completion-evidence uploader (Phase 6.4 Unit 7) redesigned in 7.6A.
// Each selected image is PUT straight to storage via a server-issued signed URL
// (api/repairs.js#uploadRepairEvidence); the parent is told only the
// server-issued evidence image ids - never a storageKey/url. Object-URL
// previews are memory-only. Upload architecture is unchanged - only presentation.
const RepairCompletionEvidence = ({ requestId, items, onChange, disabled }) => {
    const axiosSecure = useAxiosSecure();
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const atMax = items.length >= MAX_EVIDENCE_IMAGES;

    const onPick = async (event) => {
        const file = event.target.files && event.target.files[0];
        if (inputRef.current) inputRef.current.value = '';
        if (!file || uploading || atMax) return;
        if (!ALLOWED_MIME.includes(file.type)) { setError('Use a JPG, PNG, or WebP image.'); return; }
        if (file.size <= 0 || file.size > MAX_SIZE_BYTES) { setError('Image must be 5 MB or smaller.'); return; }
        setError('');
        setUploading(true);
        try {
            const imageId = await uploadRepairEvidence(axiosSecure, requestId, file);
            onChange([...items, { imageId, previewUrl: URL.createObjectURL(file), name: file.name }]);
        } catch {
            setError('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const remove = (imageId) => {
        const target = items.find((item) => item.imageId === imageId);
        if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
        onChange(items.filter((item) => item.imageId !== imageId));
    };

    return (
        <div className="space-y-2">
            <Label>Completion photos ({items.length}/{MAX_EVIDENCE_IMAGES})</Label>
            <p className="text-xs text-ds-muted-foreground">Add photos showing the completed repair (at least 1, up to {MAX_EVIDENCE_IMAGES}). JPG, PNG, or WebP.</p>
            <div className="flex flex-wrap gap-3">
                {items.map((item) => (
                    <div key={item.imageId} className="relative">
                        <img src={item.previewUrl} alt={item.name || 'Completion evidence'} className="size-24 rounded-ds object-cover border border-ds-border" />
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => remove(item.imageId)}
                                aria-label="Remove photo"
                                className="focus-ring absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-ds-destructive text-ds-destructive-foreground"
                            >
                                <X aria-hidden="true" className="size-3.5" />
                            </button>
                        )}
                    </div>
                ))}
                {!atMax && !disabled && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className="focus-ring flex size-24 flex-col items-center justify-center gap-1 rounded-ds border border-dashed border-ds-border text-xs text-ds-muted-foreground hover:bg-ds-muted/40 disabled:opacity-50"
                    >
                        {uploading ? 'Uploading…' : <><Plus aria-hidden="true" className="size-5" /> Add</>}
                    </button>
                )}
            </div>
            <input ref={inputRef} type="file" accept={ALLOWED_MIME.join(',')} className="hidden" onChange={onPick} />
            {error && <p role="alert" className="text-xs font-medium text-ds-destructive">{error}</p>}
        </div>
    );
};

export default RepairCompletionEvidence;
