import { useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { uploadRepairEvidence } from '../../api/repairs';
import { MAX_EVIDENCE_IMAGES } from '../../utils/repairForm';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Technician completion-evidence uploader (Phase 6.4 Unit 7). Each selected
// image is PUT straight to storage via a server-issued signed URL (see
// api/repairs.js#uploadRepairEvidence, which reuses the damage-image signed
// transport). The parent is told only the server-issued evidence image ids -
// never a storageKey or url. Local object-URL previews are memory-only.
const RepairCompletionEvidence = ({ requestId, items, onChange, disabled }) => {
    const axiosSecure = useAxiosSecure();
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const atMax = items.length >= MAX_EVIDENCE_IMAGES;

    const onPick = async (e) => {
        const file = e.target.files && e.target.files[0];
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
        const target = items.find((i) => i.imageId === imageId);
        if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
        onChange(items.filter((i) => i.imageId !== imageId));
    };

    return (
        <div className="space-y-2">
            <label className="label">Completion photos ({items.length}/{MAX_EVIDENCE_IMAGES})</label>
            <div className="flex flex-wrap gap-3">
                {items.map((i) => (
                    <div key={i.imageId} className="relative">
                        <img src={i.previewUrl} alt={i.name || 'evidence'} className="w-24 h-24 object-cover rounded-lg border border-base-300" />
                        {!disabled && (
                            <button type="button" onClick={() => remove(i.imageId)} className="btn btn-xs btn-circle btn-error absolute -top-2 -right-2" aria-label="Remove photo">
                                <FaTimes />
                            </button>
                        )}
                    </div>
                ))}
                {!atMax && !disabled && (
                    <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
                        className="w-24 h-24 rounded-lg border border-dashed border-base-300 flex items-center justify-center text-sm opacity-70">
                        {uploading ? 'Uploading…' : '+ Add'}
                    </button>
                )}
            </div>
            <input ref={inputRef} type="file" accept={ALLOWED_MIME.join(',')} className="hidden" onChange={onPick} />
            {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
        </div>
    );
};

export default RepairCompletionEvidence;
