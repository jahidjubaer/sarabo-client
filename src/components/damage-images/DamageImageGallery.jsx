import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import DamageImageCard from './DamageImageCard';

// Responsive gallery of finalized damage photos (Phase 6.4 Unit 3) redesigned
// in 7.6A with a Dialog-based preview. The preview URL is the same authorized
// readUrl already in the query response, held only transiently in local state -
// never persisted to the cache or rendered as text.
const DamageImageGallery = ({ images, isLoading, isError, canDelete, deletingImageId, onDelete, onRequestRefresh }) => {
    const [preview, setPreview] = useState(null);

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy="true" aria-label="Loading photos">
                {[0, 1, 2].map((key) => <Skeleton key={key} className="aspect-square w-full rounded-ds-lg" />)}
            </div>
        );
    }
    if (isError) {
        return (
            <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                <span>Photos could not be loaded.</span>
                <Button variant="ghost" size="sm" onClick={onRequestRefresh}><RefreshCw aria-hidden="true" /> Retry</Button>
            </div>
        );
    }
    if (!images || images.length === 0) {
        return <p className="text-sm text-ds-muted-foreground">No damage photos have been added yet.</p>;
    }

    return (
        <>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image, index) => (
                    <DamageImageCard
                        key={image.imageId}
                        image={image}
                        index={index}
                        canDelete={canDelete}
                        isDeleting={deletingImageId === image.imageId}
                        onDelete={onDelete}
                        onRequestRefresh={onRequestRefresh}
                        onPreview={(img, label) => setPreview({ readUrl: img.readUrl, label })}
                    />
                ))}
            </ul>
            <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}>
                <DialogContent className="max-w-3xl p-2">
                    <DialogHeader className="sr-only"><DialogTitle>{preview?.label || 'Damage photo'}</DialogTitle></DialogHeader>
                    {preview && <img src={preview.readUrl} alt={preview.label} className="max-h-[80vh] w-full rounded-ds object-contain" />}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DamageImageGallery;
