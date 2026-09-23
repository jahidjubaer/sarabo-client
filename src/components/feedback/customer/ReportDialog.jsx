import { useId, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { useCustomerFeedbackMutation } from '../../../hooks/useCustomerTechnicianFeedback';
import { customerFeedbackError, feedbackFailureNeedsRefresh, validateCustomerFeedbackText } from '../../../utils/customerFeedback';
import { REPORT_REASONS } from '../../../utils/technicianFeedback';
import { notify } from '../../../lib/notify';
import { Select } from '../../ui/select';

const targetValue = (target) => target.assignmentId ?? 'current-assignment';

export default function ReportDialog({ requestId, targets, availableTargets, canSubmit, onClose, returnFocusRef, fallbackFocusRef }) {
    const id = useId();
    // Targets are the server-projected choices captured when opening. Never
    // silently switch the chosen technician when a background response changes.
    const [selection, setSelection] = useState(targets.length === 1 ? targetValue(targets[0]) : '');
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [blocked, setBlocked] = useState(false);
    const submitting = useRef(false);
    const mutation = useCustomerFeedbackMutation(requestId, 'report');
    const busy = mutation.isPending;
    const target = targets.find((item) => targetValue(item) === selection);
    const eligible = !!target && availableTargets.some((item) => item.assignmentId === target.assignmentId);
    const submit = async (event) => {
        event.preventDefault();
        if (submitting.current || blocked || !canSubmit) return;
        const validation = {
            target: !eligible ? 'Choose an available technician for this repair.' : '',
            reason: Object.hasOwn(REPORT_REASONS, reason) ? '' : 'Select a reason.',
            description: validateCustomerFeedbackText(description, 20, 2000),
            confirmation: confirmed ? '' : 'Confirm that this report describes your experience.',
        };
        setErrors(validation);
        if (Object.values(validation).some(Boolean)) return;
        submitting.current = true; setError('');
        try {
            await mutation.mutateAsync({ reason, description, ...(target.assignmentId != null ? { assignmentId: target.assignmentId } : {}) });
            if (!mutation.isSessionCurrent()) return;
            notify.success('Report submitted for review.'); onClose();
        } catch (caught) {
            setError(customerFeedbackError(caught, 'report')); setBlocked(feedbackFailureNeedsRefresh(caught));
        } finally { submitting.current = false; }
    };
    return (
        <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
            <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto p-4 sm:max-w-lg sm:p-6" showCloseButton={!busy}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    (returnFocusRef.current?.isConnected ? returnFocusRef.current : fallbackFocusRef.current)?.focus();
                }}>
                <form noValidate autoComplete="off" onSubmit={submit} className="space-y-4">
                    <DialogHeader className="pr-6"><DialogTitle>Report an issue with technician</DialogTitle>
                        <DialogDescription>This report is sent to Sarabo administrators for review. It is separate from your review and is not shown to technicians.</DialogDescription>
                    </DialogHeader>
                    {targets.length > 1 ? <div className="space-y-2">
                        <Label htmlFor={`${id}-target`}>Technician (required)</Label>
                        <Select id={`${id}-target`} required value={selection} disabled={busy || blocked}
                            onChange={(event) => { setSelection(event.target.value); setErrors({ ...errors, target: '' }); setError(''); }}
                            aria-invalid={!!errors.target} aria-describedby={`${id}-target-error`}>
                            <option value="">Choose a technician</option>
                            {targets.map((item) => <option key={targetValue(item)} value={targetValue(item)} disabled={!availableTargets.some((current) => current.assignmentId === item.assignmentId)}>
                                {item.technicianName}{targets.filter((other) => other.technicianName === item.technicianName).length > 1 && item.assignmentId ? ` — assignment …${item.assignmentId.slice(-6)}` : ''}
                            </option>)}
                        </Select>
                        <p id={`${id}-target-error`} role={errors.target ? 'alert' : undefined} className="text-sm text-ds-destructive">{errors.target}</p>
                    </div> : <p className="break-words text-sm [overflow-wrap:anywhere]">Technician: <span className="font-medium">{targets[0]?.technicianName}</span></p>}
                    <div className="space-y-2">
                        <Label htmlFor={`${id}-reason`}>Reason (required)</Label>
                        <Select id={`${id}-reason`} required value={reason} disabled={busy || blocked}
                            onChange={(event) => { setReason(event.target.value); setErrors({ ...errors, reason: '' }); setError(''); }}
                            aria-invalid={!!errors.reason} aria-describedby={`${id}-reason-error`}>
                            <option value="">Select a reason</option>
                            {Object.entries(REPORT_REASONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </Select>
                        <p id={`${id}-reason-error`} role={errors.reason ? 'alert' : undefined} className="text-sm text-ds-destructive">{errors.reason}</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${id}-description`}>Describe your experience (required)</Label>
                        <Textarea id={`${id}-description`} rows={5} required minLength={20} maxLength={2000} value={description} disabled={busy || blocked}
                            onChange={(event) => { setDescription(event.target.value); setErrors({ ...errors, description: '' }); setError(''); }}
                            aria-invalid={!!errors.description} aria-describedby={`${id}-description-help ${id}-description-error`} />
                        <p id={`${id}-description-help`} className="text-xs text-ds-muted-foreground">20–2,000 characters of plain text, excluding surrounding spaces. No attachments. {description.length}/2,000</p>
                        <p id={`${id}-description-error`} role={errors.description ? 'alert' : undefined} className="text-sm text-ds-destructive">{errors.description}</p>
                    </div>
                    <div>
                        <label htmlFor={`${id}-confirmation`} className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm">
                            <input id={`${id}-confirmation`} type="checkbox" required checked={confirmed} disabled={busy || blocked} className="focus-ring mt-0.5 size-5 shrink-0 accent-ds-primary"
                                onChange={(event) => { setConfirmed(event.target.checked); setErrors({ ...errors, confirmation: '' }); }}
                                aria-invalid={!!errors.confirmation} aria-describedby={`${id}-confirmation-error`} />
                            <span>I confirm this report describes my experience with this repair.</span>
                        </label>
                        <p id={`${id}-confirmation-error`} role={errors.confirmation ? 'alert' : undefined} className="text-sm text-ds-destructive">{errors.confirmation}</p>
                    </div>
                    {selection && !eligible && !busy && <p role="status" className="text-sm">This technician is no longer available for a new report. Close this dialog to review the latest options.</p>}
                    {!canSubmit && !busy && <p role="status" className="text-sm">Wait for feedback to refresh before submitting.</p>}
                    <p id={`${id}-error`} role={error ? 'alert' : undefined} className="text-sm text-ds-destructive">{error}</p>
                    <DialogFooter>
                        <Button variant="outline" disabled={busy} onClick={onClose}>{blocked ? 'Close and review feedback' : 'Cancel'}</Button>
                        <Button type="submit" disabled={busy || blocked || !confirmed || !eligible || !canSubmit} aria-describedby={`${id}-error`}>{busy ? 'Submitting…' : 'Submit report'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
