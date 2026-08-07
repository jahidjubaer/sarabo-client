import { useState } from 'react';
import { FaExclamationTriangle, FaSyncAlt, FaTrash } from 'react-icons/fa';

function formatSize(bytes) {
    if (!Number.isFinite(bytes)) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

// Renders one finalized image using only the authorized, short-lived
// `readUrl` from GET /parcels/:id/damage-images - never
// `parcel.damage.images.url` (see BL-032 debt note in RequestDetails.jsx).
// `readUrl` is display-only: never rendered as visible text, never logged.
const DamageImageCard = ({ image, index, canDelete, isDeleting, onDelete, onRequestRefresh }) => {
    const [broken, setBroken] = useState(false);
    const label = `Damage evidence ${index + 1}`;

    return (
        <li className="rounded-box border border-base-300 overflow-hidden bg-base-100">
            <div className="aspect-square bg-base-200 flex items-center justify-center">
                {broken ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                        <FaExclamationTriangle className="text-warning" aria-hidden="true" />
                        <p className="text-xs opacity-70">Photo link expired</p>
                        <button
                            type="button"
                            onClick={() => { setBroken(false); onRequestRefresh(); }}
                            className="btn btn-ghost btn-xs"
                        >
                            <FaSyncAlt aria-hidden="true" /> Refresh
                        </button>
                    </div>
                ) : (
                    <img
                        src={image.readUrl}
                        alt={label}
                        loading="lazy"
                        onError={() => setBroken(true)}
                        className="w-full h-full object-cover"
                    />
                )}
            </div>
            <div className="p-2 flex items-center justify-between gap-2">
                <span className="text-xs opacity-70">{formatSize(image.size)}</span>
                {canDelete && (
                    <button
                        type="button"
                        onClick={() => onDelete(image.imageId)}
                        disabled={isDeleting}
                        className="btn btn-ghost btn-xs btn-square text-error"
                        aria-label={`Remove ${label}`}
                    >
                        <FaTrash aria-hidden="true" />
                    </button>
                )}
            </div>
        </li>
    );
};

export default DamageImageCard;
