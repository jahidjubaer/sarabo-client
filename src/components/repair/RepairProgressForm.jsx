import { useState } from 'react';
import { useAddProgress } from '../../hooks/useRepairMutations';
import { validateProgressMessage, buildProgressPayload, PROGRESS_MESSAGE_MAX } from '../../utils/repairForm';
import { notify } from '../../lib/notify';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { LoadingButton } from '../common/LoadingButton';

const PROGRESS_ERROR_COPY = {
    REPAIR_NOT_IN_PROGRESS: 'The repair is not in progress.',
    REPAIR_ALREADY_COMPLETED: 'The repair has already been completed.',
    PROGRESS_LIMIT_REACHED: 'The maximum number of progress updates has been reached.',
    TECHNICIAN_ROLE_REQUIRED: 'Only the assigned technician can post updates.',
    REQUEST_NOT_ASSIGNED_TO_TECHNICIAN: 'This request is no longer assigned to you.',
};
function progressErrorMessage(error) {
    return PROGRESS_ERROR_COPY[error?.response?.data?.code] || 'Could not add the update. Please try again.';
}

// Technician-only add-progress form (Phase 6.4 Unit 7) redesigned in 7.6A. Sends
// only the message text; id/timestamp/rider identity are server-generated. Same
// validation + useAddProgress wiring; feedback moved to Toastify.
const RepairProgressForm = ({ requestId }) => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const mutation = useAddProgress(requestId);
    const busy = mutation.isPending;

    const onSubmit = (event) => {
        event.preventDefault();
        if (busy) return;
        const check = validateProgressMessage(message);
        if (!check.valid) { setError(check.message); return; }
        setError('');
        mutation.mutate(buildProgressPayload({ message }), {
            onSuccess: () => { setMessage(''); notify.success('Progress update added'); },
            onError: (err) => notify.error(progressErrorMessage(err)),
        });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-2">
            <Label htmlFor="repairProgressMessage">Add a progress update</Label>
            <Textarea
                id="repairProgressMessage" rows={2} maxLength={PROGRESS_MESSAGE_MAX}
                placeholder="What did you just do on this repair?"
                value={message} onChange={(event) => { setMessage(event.target.value); if (error) setError(''); }}
                aria-invalid={error ? 'true' : 'false'}
            />
            {error && <p role="alert" className="text-xs font-medium text-ds-destructive">{error}</p>}
            <LoadingButton type="submit" size="sm" loading={busy} loadingText="Adding…">Add update</LoadingButton>
        </form>
    );
};

export default RepairProgressForm;
