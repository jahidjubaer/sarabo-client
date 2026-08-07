import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import DamageImageManager from '../damage-images/DamageImageManager';

// Optional post-creation photo step (Phase 6.4 Unit 3A) - reuses the
// existing Phase 6.4 Unit 3 DamageImageManager as-is (no duplicated upload
// state machine, no File/Blob or signed-URL data handled here). `requestId`
// is the just-created request's id; the manager is always rendered in
// editable mode since the request was just created (pending-pickup, no
// rider) by construction.
const PostCreationDamageStep = ({ requestId, onContinue, onSkip }) => {
    const [isBusy, setIsBusy] = useState(false);
    const headingRef = useRef(null);

    // Accessibility (Phase T): focus lands on this step's heading the
    // moment it mounts, i.e. right after a successful creation - screen
    // reader users get an immediate, unambiguous cue that creation
    // succeeded and a new step has appeared.
    useEffect(() => {
        headingRef.current?.focus();
    }, []);

    const handleSkip = () => {
        if (isBusy) return;
        onSkip();
    };

    const handleContinue = () => {
        if (isBusy) {
            Swal.fire({
                icon: 'info',
                title: 'Upload in progress',
                text: 'Please wait for the current photo upload to finish (or cancel it) before continuing.',
            });
            return;
        }
        onContinue();
    };

    return (
        <div className="card bg-base-200 p-6">
            <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold mb-2">Add damage photos</h3>
            <p className="text-sm opacity-70 mb-4">
                Your repair request has been created. Adding photos is optional at this stage - up to three
                images (JPEG, PNG, or WebP, 8 MB max each) help the technician understand the issue. You can
                skip this and add photos later while the request remains editable.
            </p>

            <DamageImageManager requestId={requestId} canEdit onBusyChange={setIsBusy} />

            <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={handleContinue} className="btn btn-primary">
                    Continue to request details
                </button>
                <button type="button" onClick={handleSkip} disabled={isBusy} className="btn btn-outline">
                    Skip for now
                </button>
            </div>
            {isBusy && <p className="text-xs opacity-70 mt-2" role="status">An upload is in progress.</p>}
        </div>
    );
};

export default PostCreationDamageStep;
