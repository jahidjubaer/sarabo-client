import { useState } from 'react';
import { useCompleteRepair } from '../../hooks/useRepairMutations';
import { validateCompletion, buildCompletionPayload, COMPLETION_SUMMARY_MAX } from '../../utils/repairForm';
import { notify } from '../../lib/notify';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { LoadingButton } from '../common/LoadingButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
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

// Technician-only completion form (Phase 6.4 Unit 7) redesigned in 7.6A.
// Requires a summary + at least one completion photo. Sends only the summary
// text and server-issued evidence image ids. Same validation +
// buildCompletionPayload/useCompleteRepair wiring; confirm via design-system
// dialog, feedback via Toastify.
const RepairCompletionForm = ({ requestId }) => {
    const [summary, setSummary] = useState('');
    const [evidence, setEvidence] = useState([]);
    const [errors, setErrors] = useState({});
    const [confirmOpen, setConfirmOpen] = useState(false);
    const mutation = useCompleteRepair(requestId);
    const busy = mutation.isPending;

    const onSubmit = (event) => {
        event.preventDefault();
        if (busy) return;
        const values = { summary, evidenceImageIds: evidence.map((item) => item.imageId) };
        const check = validateCompletion(values);
        if (!check.valid) { setErrors(check.errors); return; }
        setErrors({});
        setConfirmOpen(true);
    };

    const confirmComplete = () => {
        const values = { summary, evidenceImageIds: evidence.map((item) => item.imageId) };
        mutation.mutate(buildCompletionPayload(values), {
            onSuccess: () => { setConfirmOpen(false); notify.success('Repair completed - the customer has been notified.'); },
            onError: (err) => { setConfirmOpen(false); notify.error(completeErrorMessage(err)); },
        });
    };

    return (
        <>
            <form onSubmit={onSubmit} className="space-y-3">
                <h4 className="text-sm font-semibold text-ds-foreground">Complete repair</h4>
                <div className="space-y-1.5">
                    <Label htmlFor="repairSummary">Completion summary</Label>
                    <Textarea
                        id="repairSummary" rows={3} maxLength={COMPLETION_SUMMARY_MAX}
                        placeholder="Describe the work performed and the outcome."
                        value={summary} onChange={(event) => setSummary(event.target.value)}
                        aria-invalid={errors.summary ? 'true' : 'false'}
                    />
                    {errors.summary && <p role="alert" className="text-xs font-medium text-ds-destructive">{errors.summary}</p>}
                </div>

                <RepairCompletionEvidence requestId={requestId} items={evidence} onChange={setEvidence} disabled={busy} />
                {errors.evidenceImageIds && <p role="alert" className="text-xs font-medium text-ds-destructive">{errors.evidenceImageIds}</p>}

                <LoadingButton type="submit" loading={busy} loadingText="Completing…">Complete repair</LoadingButton>
            </form>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Complete this repair?"
                description="This marks the repair finished and notifies the customer."
                confirmLabel="Yes, complete"
                busy={busy}
                onConfirm={confirmComplete}
            />
        </>
    );
};

export default RepairCompletionForm;
