import { useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { MAX_DAMAGE_IMAGES } from '../../utils/damageImageValidation';
import DamageImageManager from '../damage-images/DamageImageManager';

// Optional post-creation photo panel (Phase 6.4 Unit 3A, redesigned ds-* in
// 7.7). Reuses the existing Phase 7.6 DamageImageManager as-is - no duplicated
// upload state machine, no File/Blob or signed-URL data handled here. The
// created request exists independently of any photo upload: an upload failure
// is surfaced by the manager itself (its own Toastify errors) and never means
// the request creation failed and never triggers a second create POST.
//
// Navigation lives in the parent success view; this panel only reports its
// in-flight upload state upward via onBusyChange so the parent can gate
// "continue" while an upload is actually running.
const PostCreationDamageStep = ({ requestId, onBusyChange }) => {
    const headingRef = useRef(null);

    // Focus lands on this panel's heading the moment it mounts (right after a
    // successful creation) so screen-reader users get an immediate, unambiguous
    // cue that a new optional step appeared.
    useEffect(() => {
        headingRef.current?.focus();
    }, []);

    return (
        <div className="rounded-ds-lg border border-ds-border bg-ds-card p-5">
            <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-ds-lg bg-ds-primary/10 text-ds-primary">
                    <Camera aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                    <h3 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-ds-foreground focus:outline-none">
                        Add damage photos <span className="font-normal text-ds-muted-foreground">(optional)</span>
                    </h3>
                    <p className="mt-1 text-sm text-ds-muted-foreground">
                        Photos help the technician understand the damage before inspection. You can add up to{' '}
                        {MAX_DAMAGE_IMAGES} images (JPEG, PNG, or WebP, 8&nbsp;MB max each), or skip this and add
                        them later while the request is still editable.
                    </p>
                </div>
            </div>

            <div className="mt-4">
                <DamageImageManager requestId={requestId} canEdit onBusyChange={onBusyChange} />
            </div>
        </div>
    );
};

export default PostCreationDamageStep;
