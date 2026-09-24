import { useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { Lock } from 'lucide-react';
import DetectedIssuesEditor from './DetectedIssuesEditor';
import { useSubmitInspection } from '../../hooks/useInspectionMutations';
import { notify } from '../../lib/notify';
import { MoneyInput } from '../ui/money-input';
import { Textarea } from '../ui/textarea';
import { FormField } from '../common/FormField';
import { LoadingButton } from '../common/LoadingButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
    REPAIRABILITY_OPTIONS, DIAGNOSIS_SUMMARY_MIN, DIAGNOSIS_SUMMARY_MAX, REASON_MIN, REASON_MAX,
    INTERNAL_NOTES_MAX, MAX_ESTIMATE_BDT, buildInspectionPayload, parseEstimate,
} from '../../utils/inspectionForm';
import { Select } from '../ui/select';

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

// A small "12 / 2000" counter under a long text field. Visual only - the
// field's own validation message is what screen readers hear.
function CharCount({ value, max }) {
    const length = typeof value === 'string' ? value.length : 0;
    return (
        <span aria-hidden="true" className={`ds-numeric text-micro ${length > max ? 'text-ds-destructive' : 'text-ds-muted-foreground'}`}>
            {length} / {max}
        </span>
    );
}

// Inspection form (Phase 4). Same react-hook-form fields, same validation
// rules, same buildInspectionPayload contract and useSubmitInspection
// mutation. Presentation changes only:
//   - character counters on the long text fields;
//   - the preliminary estimate uses MoneyInput and is hidden when the device
//     is "Not repairable" (blank estimates are sent then, which the payload
//     already allows - both fields are optional);
//   - internal notes are marked private with a lock, not styled as a warning.
// Internal notes are never shown to the customer (they see InspectionSummary).
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
    const [diagnosisSummary, repairabilityDecision, repairabilityReason, internalNotes] = useWatch({
        control,
        name: ['diagnosisSummary', 'repairabilityDecision', 'repairabilityReason', 'internalNotes'],
    });

    const busy = isSubmitting || mutation.isPending;
    const showEstimate = repairabilityDecision !== 'not_repairable';
    const estimateRule = { validate: (v) => !showEstimate || parseEstimate(v).ok || `Enter a whole number of taka (0-${MAX_ESTIMATE_BDT}) or leave blank.` };

    const onValid = (values) => {
        if (busy) return;
        setPendingValues(showEstimate ? values : { ...values, laborEstimate: '', partsEstimate: '' });
    };

    const confirmSubmit = () => {
        const values = pendingValues;
        if (!values) return;
        mutation.mutate(buildInspectionPayload(values), {
            onSuccess: () => { setPendingValues(null); notify.success('Inspection submitted. The customer will be notified.'); },
            onError: (error) => { setPendingValues(null); notify.error(submitErrorMessage(error)); },
        });
    };

    return (
        <>
            <form onSubmit={handleSubmit(onValid)} className="space-y-5" noValidate>
                <FormField id="diagnosisSummary" label="What you found" required error={errors.diagnosisSummary?.message}>
                    <Textarea
                        id="diagnosisSummary" rows={4} placeholder="Describe what you found on inspection"
                        {...register('diagnosisSummary', {
                            required: 'A diagnosis summary is required.',
                            minLength: { value: DIAGNOSIS_SUMMARY_MIN, message: `At least ${DIAGNOSIS_SUMMARY_MIN} characters.` },
                            maxLength: { value: DIAGNOSIS_SUMMARY_MAX, message: `At most ${DIAGNOSIS_SUMMARY_MAX} characters.` },
                        })}
                    />
                </FormField>
                <div className="-mt-4 flex justify-end"><CharCount value={diagnosisSummary} max={DIAGNOSIS_SUMMARY_MAX} /></div>

                <DetectedIssuesEditor fields={fields} register={register} errors={errors} append={append} remove={remove} />

                <fieldset className="space-y-4 rounded-ds-lg border border-ds-border p-4">
                    <legend className="px-1 text-body-sm font-bold text-ds-foreground">Can it be repaired?</legend>
                    <FormField id="repairabilityDecision" label="Decision" required error={errors.repairabilityDecision?.message}>
                        <Select id="repairabilityDecision" defaultValue="" {...register('repairabilityDecision', { required: 'Select a repairability decision.' })}>
                            <option value="" disabled>Select a decision</option>
                            {REPAIRABILITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </Select>
                    </FormField>
                    <FormField id="repairabilityReason" label="Reason" required error={errors.repairabilityReason?.message}>
                        <Textarea
                            id="repairabilityReason" rows={3} placeholder="Explain the decision in plain words for the customer"
                            {...register('repairabilityReason', {
                                required: 'A reason is required.',
                                minLength: { value: REASON_MIN, message: `At least ${REASON_MIN} characters.` },
                                maxLength: { value: REASON_MAX, message: `At most ${REASON_MAX} characters.` },
                            })}
                        />
                    </FormField>
                    <div className="-mt-3 flex justify-end"><CharCount value={repairabilityReason} max={REASON_MAX} /></div>
                </fieldset>

                {showEstimate && (
                    <fieldset className="rounded-ds-lg border border-ds-border p-4">
                        <legend className="px-1 text-body-sm font-bold text-ds-foreground">Preliminary estimate</legend>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField id="laborEstimate" label="Labour (BDT)" hint="Optional" error={errors.laborEstimate?.message}>
                                <MoneyInput id="laborEstimate" inputMode="numeric" {...register('laborEstimate', estimateRule)} />
                            </FormField>
                            <FormField id="partsEstimate" label="Parts (BDT)" hint="Optional" error={errors.partsEstimate?.message}>
                                <MoneyInput id="partsEstimate" inputMode="numeric" {...register('partsEstimate', estimateRule)} />
                            </FormField>
                        </div>
                        <p className="mt-3 text-micro text-ds-muted-foreground">A rough guide, not the quote. It pre-fills your quote so you don't type it twice.</p>
                    </fieldset>
                )}

                <div className="rounded-ds-lg bg-ds-muted p-4">
                    <FormField
                        id="internalNotes"
                        label={<span className="inline-flex items-center gap-1.5"><Lock aria-hidden="true" className="size-3.5" />Private notes</span>}
                        hint="Optional. Only you and the admin team see these, never the customer."
                        error={errors.internalNotes?.message}
                    >
                        <Textarea
                            id="internalNotes" rows={3} placeholder="Anything for you or the admin team"
                            {...register('internalNotes', { maxLength: { value: INTERNAL_NOTES_MAX, message: `At most ${INTERNAL_NOTES_MAX} characters.` } })}
                        />
                    </FormField>
                    <div className="mt-1 flex justify-end"><CharCount value={internalNotes} max={INTERNAL_NOTES_MAX} /></div>
                </div>

                <LoadingButton type="submit" variant="action" size="lg" loading={busy} loadingText="Submitting…">Submit inspection</LoadingButton>
            </form>

            <ConfirmDialog
                open={!!pendingValues}
                onOpenChange={(open) => { if (!open) setPendingValues(null); }}
                title="Submit inspection?"
                description="The customer sees your findings. You can't edit the inspection after submitting."
                confirmVariant="action"
                confirmLabel="Submit inspection"
                busy={mutation.isPending}
                onConfirm={confirmSubmit}
            />
        </>
    );
};

export default InspectionForm;
