import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import DetectedIssuesEditor from './DetectedIssuesEditor';
import { useSubmitInspection } from '../../hooks/useInspectionMutations';
import { notify } from '../../lib/notify';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { LoadingButton } from '../common/LoadingButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
    REPAIRABILITY_OPTIONS, DIAGNOSIS_SUMMARY_MIN, DIAGNOSIS_SUMMARY_MAX, REASON_MIN, REASON_MAX,
    INTERNAL_NOTES_MAX, MAX_ESTIMATE_BDT, buildInspectionPayload, parseEstimate,
} from '../../utils/inspectionForm';

const SUBMIT_ERROR_COPY = {
    INSPECTION_ALREADY_SUBMITTED: 'An inspection has already been submitted for this request.',
    INSPECTION_NOT_ALLOWED: 'This request is no longer at the stage where an inspection can be submitted.',
    TECHNICIAN_ROLE_REQUIRED: 'Only the assigned technician can submit an inspection.',
    REQUEST_NOT_ASSIGNED_TO_TECHNICIAN: 'This request is no longer assigned to you.',
    REQUEST_NOT_FOUND: 'This repair request is unavailable.',
    LEGACY_REQUEST_NOT_SUPPORTED: 'Inspection is only available for newer repair requests.',
    INVALID_DIAGNOSIS: 'Please review the diagnosis fields and try again.',
    INVALID_DETECTED_ISSUES: 'Please review the detected issues and try again.',
    INVALID_REPAIRABILITY: 'Please review the repairability decision and try again.',
    INVALID_INSPECTION_ESTIMATE: 'Please review the estimate amounts and try again.',
    INVALID_INSPECTION: 'Please review the form and try again.',
};
function submitErrorMessage(error) {
    return SUBMIT_ERROR_COPY[error?.response?.data?.code] || 'Could not submit the inspection. Please try again.';
}

const selectClass = "flex h-10 w-full rounded-ds border border-ds-input bg-ds-background px-3 text-sm text-ds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ring aria-[invalid=true]:border-ds-destructive";

// Inspection form (Phase 6.4 Unit 4) redesigned in 7.6A: same react-hook-form
// fields, same validation rules, same buildInspectionPayload contract and
// useSubmitInspection mutation - only the presentation, a design-system confirm
// dialog, and Toastify feedback changed. Internal notes stay clearly marked and
// are never shown to the customer (customer view uses InspectionSummary).
const InspectionForm = ({ requestId }) => {
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            diagnosisSummary: '',
            detectedIssues: [{ label: '', severity: '', notes: '' }],
            repairabilityDecision: '',
            repairabilityReason: '',
            laborEstimate: '',
            partsEstimate: '',
            internalNotes: '',
        },
    });
    const { fields, append, remove } = useFieldArray({ control, name: 'detectedIssues' });
    const mutation = useSubmitInspection(requestId);
    const [pendingValues, setPendingValues] = useState(null);

    const busy = isSubmitting || mutation.isPending;
    const estimateRule = { validate: (v) => parseEstimate(v).ok || `Enter a whole number of taka (0-${MAX_ESTIMATE_BDT}) or leave blank.` };

    const onValid = (values) => { if (!busy) setPendingValues(values); };

    const confirmSubmit = () => {
        const values = pendingValues;
        if (!values) return;
        mutation.mutate(buildInspectionPayload(values), {
            onSuccess: () => { setPendingValues(null); notify.success('Inspection submitted - the customer will be notified.'); },
            onError: (error) => { setPendingValues(null); notify.error(submitErrorMessage(error)); },
        });
    };

    return (
        <>
            <form onSubmit={handleSubmit(onValid)} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                    <Label htmlFor="diagnosisSummary">Diagnosis summary</Label>
                    <Textarea
                        id="diagnosisSummary" rows={4} placeholder="Describe what you found on inspection"
                        aria-invalid={errors.diagnosisSummary ? 'true' : 'false'}
                        {...register('diagnosisSummary', {
                            required: 'A diagnosis summary is required.',
                            minLength: { value: DIAGNOSIS_SUMMARY_MIN, message: `At least ${DIAGNOSIS_SUMMARY_MIN} characters.` },
                            maxLength: { value: DIAGNOSIS_SUMMARY_MAX, message: `At most ${DIAGNOSIS_SUMMARY_MAX} characters.` },
                        })}
                    />
                    {errors.diagnosisSummary && <p role="alert" className="text-xs font-medium text-ds-destructive">{errors.diagnosisSummary.message}</p>}
                </div>

                <DetectedIssuesEditor fields={fields} register={register} errors={errors} append={append} remove={remove} />

                <div className="space-y-3 rounded-ds-lg border border-ds-border p-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="repairabilityDecision">Repairability</Label>
                        <select
                            id="repairabilityDecision" defaultValue="" className={selectClass}
                            aria-invalid={errors.repairabilityDecision ? 'true' : 'false'}
                            {...register('repairabilityDecision', { required: 'Select a repairability decision.' })}
                        >
                            <option value="" disabled>Select a decision</option>
                            {REPAIRABILITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        {errors.repairabilityDecision && <p role="alert" className="text-xs font-medium text-ds-destructive">{errors.repairabilityDecision.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="repairabilityReason">Reason</Label>
                        <Textarea
                            id="repairabilityReason" rows={3} placeholder="Explain the repairability decision"
                            aria-invalid={errors.repairabilityReason ? 'true' : 'false'}
                            {...register('repairabilityReason', {
                                required: 'A reason is required.',
                                minLength: { value: REASON_MIN, message: `At least ${REASON_MIN} characters.` },
                                maxLength: { value: REASON_MAX, message: `At most ${REASON_MAX} characters.` },
                            })}
                        />
                        {errors.repairabilityReason && <p role="alert" className="text-xs font-medium text-ds-destructive">{errors.repairabilityReason.message}</p>}
                    </div>
                </div>

                <div className="rounded-ds-lg border border-ds-border p-4">
                    <p className="mb-3 text-sm font-semibold text-ds-foreground">Preliminary estimate (BDT)</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="laborEstimate">Labor</Label>
                            <Input id="laborEstimate" type="number" min="0" step="1" inputMode="numeric" placeholder="Optional"
                                aria-invalid={errors.laborEstimate ? 'true' : 'false'} {...register('laborEstimate', estimateRule)} />
                            {errors.laborEstimate && <p role="alert" className="text-xs font-medium text-ds-destructive">{errors.laborEstimate.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="partsEstimate">Parts</Label>
                            <Input id="partsEstimate" type="number" min="0" step="1" inputMode="numeric" placeholder="Optional"
                                aria-invalid={errors.partsEstimate ? 'true' : 'false'} {...register('partsEstimate', estimateRule)} />
                            {errors.partsEstimate && <p role="alert" className="text-xs font-medium text-ds-destructive">{errors.partsEstimate.message}</p>}
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-ds-muted-foreground">This is a preliminary technician estimate, not a final quote or an amount to be paid now.</p>
                </div>

                <div className="space-y-1.5 rounded-ds-lg border border-ds-warning/30 bg-ds-warning/5 p-4">
                    <Label htmlFor="internalNotes">Internal technician notes (optional)</Label>
                    <Textarea
                        id="internalNotes" rows={3} placeholder="Notes for you and the admin team"
                        aria-describedby="internalNotes-help"
                        {...register('internalNotes', { maxLength: { value: INTERNAL_NOTES_MAX, message: `At most ${INTERNAL_NOTES_MAX} characters.` } })}
                    />
                    <p id="internalNotes-help" className="text-xs text-ds-muted-foreground">Private to you and admins — the customer never sees them.</p>
                    {errors.internalNotes && <p role="alert" className="text-xs font-medium text-ds-destructive">{errors.internalNotes.message}</p>}
                </div>

                <LoadingButton type="submit" loading={busy} loadingText="Submitting…">Submit inspection</LoadingButton>
            </form>

            <ConfirmDialog
                open={!!pendingValues}
                onOpenChange={(open) => { if (!open) setPendingValues(null); }}
                title="Submit inspection?"
                description="Once submitted, this inspection is final and cannot be edited."
                confirmLabel="Submit inspection"
                busy={mutation.isPending}
                onConfirm={confirmSubmit}
            />
        </>
    );
};

export default InspectionForm;
