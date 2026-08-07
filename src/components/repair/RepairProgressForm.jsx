import { useState } from 'react';
import Swal from 'sweetalert2';
import { useAddProgress } from '../../hooks/useRepairMutations';
import { validateProgressMessage, buildProgressPayload, PROGRESS_MESSAGE_MAX } from '../../utils/repairForm';

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

// Technician-only add-progress form (Phase 6.4 Unit 7). Sends only the message
// text; the update id, timestamp, and rider identity are all server-generated.
const RepairProgressForm = ({ requestId }) => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const mutation = useAddProgress(requestId);
    const busy = mutation.isPending;

    const onSubmit = (e) => {
        e.preventDefault();
        if (busy) return;
        const check = validateProgressMessage(message);
        if (!check.valid) { setError(check.message); return; }
        setError('');
        mutation.mutate(buildProgressPayload({ message }), {
            onSuccess: () => setMessage(''),
            onError: (err) => Swal.fire({ icon: 'error', title: 'Could not add update', text: progressErrorMessage(err) }),
        });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-2">
            <label className="label" htmlFor="repairProgressMessage">Add a progress update</label>
            <textarea id="repairProgressMessage" rows={2} maxLength={PROGRESS_MESSAGE_MAX}
                className={`textarea w-full ${error ? 'textarea-error' : ''}`}
                placeholder="What did you just do on this repair?"
                value={message} onChange={(e) => setMessage(e.target.value)} />
            {error && <p role="alert" className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={busy} className="btn btn-sm btn-primary">{busy ? 'Adding…' : 'Add update'}</button>
        </form>
    );
};

export default RepairProgressForm;
