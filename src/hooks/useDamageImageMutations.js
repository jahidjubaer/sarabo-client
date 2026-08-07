import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosSecure from './useAxiosSecure';
import { damageImageKeys } from './damageImageKeys';
import {
    createDamageUploadSession, finalizeDamageUpload, removeDamageImage, uploadFileToSignedUrl,
} from '../api/damageImages';
import { normalizeDamageImageError } from '../utils/damageImageErrors';

// Simple mutation, no optimistic update (Phase R: "wait for mutation
// success, invalidate query afterward" - removal isn't safely reversible
// enough client-side to justify an optimistic rollback path). Identifies
// the image by imageId only - storageKey is never known to, or sent by,
// the client at all.
export function useRemoveDamageImage(requestId) {
    const queryClient = useQueryClient();
    const axiosSecure = useAxiosSecure();

    return useMutation({
        mutationFn: (imageId) => removeDamageImage(axiosSecure, requestId, imageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: damageImageKeys.request(requestId) });
        },
    });
}

let localIdCounter = 0;
function generateLocalId() {
    localIdCounter += 1;
    return `local-${Date.now()}-${localIdCounter}`;
}

const ACTIVE_STATUSES = ['preparing', 'uploading', 'finalizing'];

function queueReducer(state, action) {
    switch (action.type) {
        case 'ENQUEUE':
            return [...state, ...action.items];
        case 'PATCH':
            return state.map((item) => (item.localId === action.localId ? { ...item, ...action.patch } : item));
        case 'REMOVE':
            return state.filter((item) => item.localId !== action.localId);
        default:
            return state;
    }
}

// Sequential upload orchestration (Phase 6.4 Unit 3, Phases H/K/L/M/N).
// Manages an in-memory-only local queue of in-flight upload items,
// completely separate from the server-persisted image list (see
// useDamageImages) - a completed item's file/preview/session data is never
// written into the TanStack Query cache, only ever this hook's own local
// state, and is expected to be dropped by the caller (via removeItem) once
// the corresponding finalized image appears in the authorized gallery.
//
// One field on each item is internal-only (leading underscore) and must
// never be rendered or logged: `_putSucceeded` (retry bookkeeping). The
// signed upload URL itself is never stored in item state at all - it's
// used directly from the just-created session's local variable within
// processItem and discarded immediately after the PUT resolves.
export function useDamageImageUploadQueue({ requestId }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [items, dispatch] = useReducer(queueReducer, []);

    // Abort controllers and the current item snapshot are transport state,
    // not render state - they must survive re-renders without being
    // recreated, and processItem needs the latest item list without
    // re-subscribing every render.
    const controllersRef = useRef(new Map());
    const itemsRef = useRef(items);
    itemsRef.current = items;
    const processingRef = useRef(false);

    useEffect(() => {
        // Unmount cleanup only - revokes every preview this hook instance
        // ever created and aborts anything still in flight, so nothing
        // outlives the component. Both refs' current Map/array are captured
        // into local variables here (not read fresh inside the returned
        // cleanup) since a ref's `.current` could in principle differ by
        // the time cleanup actually runs.
        const controllers = controllersRef.current;
        return () => {
            itemsRef.current.forEach((item) => {
                if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
            });
            controllers.forEach((controller) => controller.abort());
        };
    }, []);

    const patchItem = useCallback((localId, patch) => {
        dispatch({ type: 'PATCH', localId, patch });
    }, []);

    const processItem = useCallback(async (localId) => {
        const item = itemsRef.current.find((entry) => entry.localId === localId);
        if (!item) return;

        const controller = new AbortController();
        controllersRef.current.set(localId, controller);

        try {
            let uploadSessionId = item.uploadSessionId;

            // Skips straight to finalize on a finalize-only retry (the PUT
            // already succeeded once - see retryItem below). Any other
            // path always requests a brand-new session rather than
            // assuming a previous signed URL is still valid/unexpired.
            if (!item._putSucceeded) {
                patchItem(localId, { status: 'preparing', errorCode: null, errorMessage: null });
                const session = await createDamageUploadSession(axiosSecure, requestId, {
                    fileName: item.file.name, mimeType: item.file.type, size: item.file.size,
                });
                if (controller.signal.aborted) return;
                uploadSessionId = session.uploadSessionId;
                patchItem(localId, { uploadSessionId });

                patchItem(localId, { status: 'uploading', progress: 0 });
                // Transport-completing at 100% does not mean "done" - the
                // item stays 'uploading' until the PUT promise itself
                // resolves, then moves straight to 'finalizing' below
                // (never shown as 'complete' before the server confirms).
                await uploadFileToSignedUrl(session.upload, item.file, {
                    signal: controller.signal,
                    onProgress: (progress) => patchItem(localId, { progress }),
                });
                if (controller.signal.aborted) return;
                patchItem(localId, { _putSucceeded: true });
            }

            patchItem(localId, { status: 'finalizing' });
            const result = await finalizeDamageUpload(axiosSecure, requestId, uploadSessionId);
            if (controller.signal.aborted) return;

            patchItem(localId, { status: 'complete', serverImageId: result.image.imageId, progress: 100 });
            queryClient.invalidateQueries({ queryKey: damageImageKeys.request(requestId) });
        } catch (error) {
            if (error?.isCancelled || controller.signal.aborted) {
                patchItem(localId, { status: 'cancelled' });
                return;
            }
            const normalized = normalizeDamageImageError(error);
            patchItem(localId, { status: 'failed', errorCode: normalized.code, errorMessage: normalized.message });
        } finally {
            controllersRef.current.delete(localId);
        }
    }, [axiosSecure, requestId, queryClient, patchItem]);

    // Sequential policy (Phase L): at most one item is ever preparing/
    // uploading/finalizing at a time. The next queued item only starts
    // once the current one has fully settled.
    useEffect(() => {
        if (processingRef.current) return;
        if (items.some((item) => ACTIVE_STATUSES.includes(item.status))) return;
        const next = items.find((item) => item.status === 'queued');
        if (!next) return;

        processingRef.current = true;
        processItem(next.localId).finally(() => {
            processingRef.current = false;
        });
    }, [items, processItem]);

    const addFiles = useCallback((files) => {
        const newItems = files.map((file) => ({
            localId: generateLocalId(),
            file,
            previewUrl: URL.createObjectURL(file),
            status: 'queued',
            progress: 0,
            uploadSessionId: null,
            serverImageId: null,
            errorCode: null,
            errorMessage: null,
            _putSucceeded: false,
        }));
        dispatch({ type: 'ENQUEUE', items: newItems });
    }, []);

    // Cancellation (Phase N): only meaningful while preparing/uploading -
    // aborts the in-flight request via AbortController. Never claims the
    // server-side upload session itself was cancelled (no such endpoint
    // exists yet) - an abandoned session simply expires after 20 minutes
    // and is later reported, never auto-deleted, by
    // sarabo-server's scripts/audit-damage-uploads.js.
    const cancelItem = useCallback((localId) => {
        const controller = controllersRef.current.get(localId);
        if (controller) controller.abort();
        else patchItem(localId, { status: 'cancelled' });
    }, [patchItem]);

    const retryItem = useCallback((localId) => {
        const item = itemsRef.current.find((entry) => entry.localId === localId);
        if (!item) return;
        const finalizeOnly = item._putSucceeded && !!item.uploadSessionId;
        patchItem(localId, {
            status: 'queued', errorCode: null, errorMessage: null, progress: finalizeOnly ? 100 : 0,
            ...(finalizeOnly ? {} : { uploadSessionId: null, _putSucceeded: false }),
        });
    }, [patchItem]);

    const removeItem = useCallback((localId) => {
        const item = itemsRef.current.find((entry) => entry.localId === localId);
        const controller = controllersRef.current.get(localId);
        if (controller) controller.abort();
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
        dispatch({ type: 'REMOVE', localId });
    }, []);

    const isProcessing = items.some((item) => ACTIVE_STATUSES.includes(item.status) || item.status === 'queued');

    return { items, addFiles, retryItem, cancelItem, removeItem, isProcessing };
}
