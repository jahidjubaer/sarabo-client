import { useState } from 'react';
import { TriangleAlert, RefreshCw, Trash2, ZoomIn } from 'lucide-react';
import { Button } from '../ui/button';

function formatSize(bytes) {
    if (!Number.isFinite(bytes)) return '';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

// One finalized image (Phase 6.4 Unit 3) redesigned in 7.6A. Renders only the
// authorized short-lived `readUrl` (display-only, never shown as text/logged).
// Clicking opens a larger preview via the gallery's Dialog.
const DamageImageCard = ({ image, index, canDelete, isDeleting, onDelete, onRequestRefresh, onPreview }) => {
    const [broken, setBroken] = useState(false);
    const label = `Damage evidence ${index + 1}`;

    return (
        <li className="overflow-hidden rounded-ds-lg border border-ds-border bg-ds-card">
            <div className="relative flex aspect-square items-center justify-center bg-ds-muted">
                {broken ? (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                        <TriangleAlert aria-hidden="true" className="size-5 text-ds-warning" />
                        <p className="text-xs text-ds-muted-foreground">Photo link expired</p>
                        <Button variant="ghost" size="sm" onClick={() => { setBroken(false); onRequestRefresh(); }}>
                            <RefreshCw aria-hidden="true" /> Refresh
                        </Button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => onPreview(image, label)}
                        aria-label={`Preview ${label}`}
                        className="group relative h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring"
                    >
                        <img src={image.readUrl} alt={label} loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                            <ZoomIn aria-hidden="true" className="size-6" />
                        </span>
                    </button>
                )}
            </div>
            <div className="flex items-center justify-between gap-2 p-2">
                <span className="text-xs text-ds-muted-foreground">{formatSize(image.size)}</span>
                {canDelete && (
                    <Button variant="ghost" size="icon" onClick={() => onDelete(image.imageId)} disabled={isDeleting} aria-label={`Remove ${label}`} className="text-ds-destructive hover:text-ds-destructive">
                        <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                )}
            </div>
        </li>
    );
};

export default DamageImageCard;
