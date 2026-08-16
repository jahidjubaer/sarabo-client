import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useDamageImages } from '../../hooks/useDamageImages';
import { useDamageImageUploadQueue, useRemoveDamageImage } from '../../hooks/useDamageImageMutations';
import { damageImageKeys } from '../../hooks/damageImageKeys';
import { normalizeDamageImageError } from '../../utils/damageImageErrors';
import { MAX_DAMAGE_IMAGES } from '../../utils/damageImageValidation';
import { notify } from '../../lib/notify';
import { ConfirmDialog } from '../common/ConfirmDialog';
import DamageImagePicker from './DamageImagePicker';
import DamageImageGallery from './DamageImageGallery';
import UploadProgressItem from './UploadProgressItem';

const COMPLETE_ITEM_DISPLAY_MS = 1500;

// Reusable, route-independent damage-evidence photo manager (Phase 6.4
// Unit 3). `canEdit` is the caller's own UX guess (see
// src/utils/damageImageValidation.js#canEditDamageImages) - never trusted
// as final authority on its own: every mutating action still goes through
// the server, and a stale guess just surfaces as a DAMAGE_IMAGES_LOCKED
// response, handled here by switching the whole component read-only.
// `accessRole` from the authorized list response is a second, independent
// gate - upload/delete controls render only when the server itself
// confirms this caller is the request's owner, regardless of `canEdit`.
const DamageImageManager = ({ requestId, canEdit = false, maxImages = MAX_DAMAGE_IMAGES, onBusyChange }) => {
    const queryClient = useQueryClient();
    const [serverLocked, setServerLocked] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const { data, isLoading, isPaused, isError, refetch } = useDamageImages(requestId, { enabled: !!requestId });
    const { items, addFiles, retryItem, cancelItem, removeItem, isProcessing } = useDamageImageUploadQueue({ requestId });
    const removeMutation = useRemoveDamageImage(requestId);
    const removalErrorNoticeRef = useRef(null);

    // Narrow, optional busy signal (Phase 6.4 Unit 3A) for a caller (see
    // PostCreationDamageStep.jsx) that needs to gate its own navigation
    // while an upload is actively in flight - never exposes anything else
    // about queue internals (no File/Blob data, no signed URLs).
    useEffect(() => {
        onBusyChange?.(isProcessing);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isProcessing]);

    const hasUsableData = data !== undefined && data !== null;
    const isInitialLoading = isLoading && !hasUsableData;
    const isUnavailableBeforeData = isPaused && !hasUsableData;
    const isReadErrorBeforeData = isError && !hasUsableData;
    const images = data?.images || [];
    const totalImages = data?.totalImages ?? images.length;
    const isOwnerConfirmedByServer = data?.accessRole === 'owner';
    const effectiveCanEdit = canEdit && isOwnerConfirmedByServer && !serverLocked;

    // Complete items briefly show "Uploaded" before disappearing from the
    // in-progress list, once the same image has merged into the gallery
    // grid below (see useDamageImageUploadQueue's own doc comment on why
    // this hook never renders its queue items forever).
    useEffect(() => {
        const completedIds = items.filter((item) => item.status === 'complete').map((item) => item.localId);
        if (completedIds.length === 0) return undefined;
        const timers = completedIds.map((localId) => setTimeout(() => removeItem(localId), COMPLETE_ITEM_DISPLAY_MS));
        return () => timers.forEach(clearTimeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    // A DAMAGE_IMAGES_LOCKED response from the upload queue (e.g. a
    // technician was assigned mid-upload) switches the whole manager
    // read-only immediately, rather than only failing that one file.
    useEffect(() => {
        if (items.some((item) => item.status === 'failed' && item.errorCode === 'DAMAGE_IMAGES_LOCKED')) {
            setServerLocked(true);
        }
    }, [items]);

    const handleFilesSelected = (files) => addFiles(files);
    const retryImages = () => queryClient.resetQueries({ queryKey: damageImageKeys.request(requestId) });

    // Opens the design-system confirm dialog; the mutation only fires on
    // confirm. Behaviour/endpoints are unchanged - only the confirm/feedback UI.
    const handleDelete = (imageId) => setDeleteTargetId(imageId);

    const confirmDelete = () => {
        const imageId = deleteTargetId;
        if (!imageId) return;
        removeMutation.mutate(imageId, {
            onSuccess: () => {
                setDeleteTargetId(null);
                notify.success('Photo removed');
            },
            onError: (error) => {
                const normalized = normalizeDamageImageError(error);
                setDeleteTargetId(null);
                if (normalized.code === 'DAMAGE_IMAGES_LOCKED') {
                    setServerLocked(true);
                } else if (normalized.code === 'DAMAGE_IMAGE_NOT_FOUND') {
                    refetch();
                }
                if (removalErrorNoticeRef.current !== normalized.code) {
                    removalErrorNoticeRef.current = normalized.code;
                }
                notify.error(normalized.message);
            },
        });
    };

    if (!requestId) return null;

    return (
        <div>
            {effectiveCanEdit && (
                <div className="mb-4">
                    <DamageImagePicker
                        // `totalImages` already reflects any 'complete' item
                        // once its invalidateQueries-triggered refetch
                        // resolves, so only still-in-flight (not yet
                        // complete/failed/cancelled) local items are added
                        // on top - avoids briefly double-counting a just-
                        // finalized image in both places at once.
                        existingCount={totalImages + items.filter((item) => item.status === 'queued' || item.status === 'preparing' || item.status === 'uploading' || item.status === 'finalizing').length}
                        maxImages={maxImages}
                        disabled={isProcessing}
                        onFilesSelected={handleFilesSelected}
                    />
                </div>
            )}

            {items.length > 0 && (
                <ul className="space-y-2 mb-4">
                    {items.map((item) => (
                        <UploadProgressItem
                            key={item.localId}
                            item={item}
                            onRetry={retryItem}
                            onCancel={cancelItem}
                            onRemove={removeItem}
                        />
                    ))}
                </ul>
            )}

            <DamageImageGallery
                images={images}
                isLoading={isInitialLoading}
                isUnavailable={isUnavailableBeforeData}
                isError={isReadErrorBeforeData}
                canDelete={effectiveCanEdit}
                deletingImageId={removeMutation.isPending ? removeMutation.variables : null}
                onDelete={handleDelete}
                onRetry={retryImages}
                onRequestRefresh={refetch}
            />

            <ConfirmDialog
                open={!!deleteTargetId}
                onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
                title="Remove this photo?"
                description="This cannot be undone."
                confirmLabel="Remove photo"
                destructive
                busy={removeMutation.isPending}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default DamageImageManager;
