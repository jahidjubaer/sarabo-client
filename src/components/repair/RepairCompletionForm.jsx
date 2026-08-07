import { useState } from 'react';
import Swal from 'sweetalert2';
import { useCompleteRepair } from '../../hooks/useRepairMutations';
import { validateCompletion, buildCompletionPayload, COMPLETION_SUMMARY_MAX } from '../../utils/repairForm';
import RepairCompletionEvidence from './RepairCompletionEvidence';

const COMPLETE_ERROR_COPY = {
    REPAIR_NOT_IN_PROGRESS: 'The repair is not in progress.',
    REPAIR_ALREADY_COMPLETED: 'This repair has already been completed.',
    INVALID_COMPLETION_EVIDENCE: 'Please review the completion photos.',
    INVALID_COMPLETION_SUMMARY: 'Please review the completion summary.',
    EVIDENCE_NOT_FOUND: 'One of the completion photos could not be found. Please re-upload.',
    TECHNICIAN_ROLE_REQUIRED: 'Only the assigned technician can complete this repair.',
    REQUEST_NOT_ASSIGNED_TO_TECHNICIAN: 'This request is no longer assigned to you.',
};
function completeErrorMessage(error) {
    return COMPLETE_ERROR_COPY[error?.response?.data?.code] || 'Could not complete the repair. Please try again.';
}

// Technician-only completion form (Phase 6.4 Unit 7). Requires a summary and at
// least one completion photo. Sends only the summary text and the server-issued
// evidence image ids - never a rider id, status, timestamp, storageKey, or url.
const RepairCompletionForm = ({ requestId }) => {
    const [summary, setSummary] = useState('');
    const [evidence, setEvidence] = useState([]);
    const [errors, setErrors] = useState({});
    const mutation = useCompleteRepair(requestId);
    const busy = mutation.isPending;

    const onSubmit = async (e) => {
        e.preventDefault();
        if (busy) return;
        const values = { summary, evidenceImageIds: evidence.map((i) => i.imageId) };
        const check = validateCompletion(values);
        if (!check.valid) { setErrors(check.errors); return; }
        setErrors({});

        const confirm = await Swal.fire({
            title: 'Complete this repair?',
            text: 'This marks the repair finished and notifies the customer.',
            icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, complete',
        });
        if (!confirm.isConfirmed) return;

        mutation.mutate(buildCompletionPayload(values), {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Repair completed', text: 'The customer has been notified.' }),
            onError: (err) => Swal.fire({ icon: 'error', title: 'Could not complete repair', text: completeErrorMessage(err) }),
        });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <h4 className="font-semibold">Complete repair</h4>
            <div>
                <label className="label" htmlFor="repairSummary">Completion summary</label>
                <textarea id="repairSummary" rows={3} maxLength={COMPLETION_SUMMARY_MAX}
                    className={`textarea w-full ${errors.summary ? 'textarea-error' : ''}`}
                    placeholder="Describe the work performed and the outcome."
                    value={summary} onChange={(e) => setSummary(e.target.value)} />
                {errors.summary && <p role="alert" className="text-red-500 text-sm">{errors.summary}</p>}
            </div>

            <RepairCompletionEvidence requestId={requestId} items={evidence} onChange={setEvidence} disabled={busy} />
            {errors.evidenceImageIds && <p role="alert" className="text-red-500 text-sm">{errors.evidenceImageIds}</p>}

            <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Completing…' : 'Complete repair'}</button>
        </form>
    );
};

export default RepairCompletionForm;
