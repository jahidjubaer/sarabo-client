import { useForm, useFieldArray } from 'react-hook-form';
import Swal from 'sweetalert2';
import DetectedIssuesEditor from './DetectedIssuesEditor';
import { useSubmitInspection } from '../../hooks/useInspectionMutations';
import {
    REPAIRABILITY_OPTIONS, DIAGNOSIS_SUMMARY_MIN, DIAGNOSIS_SUMMARY_MAX, REASON_MIN, REASON_MAX,
    INTERNAL_NOTES_MAX, MAX_ESTIMATE_BDT, buildInspectionPayload, parseEstimate,
} from '../../utils/inspectionForm';

// Maps the server's controlled inspection error codes to short, safe UI copy -
// never renders a raw Axios/network error. On an "already submitted / no
// longer allowed" outcome the surrounding section refetches (see
// useSubmitInspection's onSettled) and swaps the form for the read-only
// summary, so the technician always re-syncs to server truth.
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
    const code = error?.response?.data?.code;
    return SUBMIT_ERROR_COPY[code] || 'Could not submit the inspection. Please try again.';
}

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

    const busy = isSubmitting || mutation.isPending;

    const onSubmit = async (values) => {
        if (busy) return;
        const confirm = await Swal.fire({
            title: 'Submit inspection?',
            text: 'Once submitted, this inspection is final and cannot be edited.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, submit',
        });
        if (!confirm.isConfirmed) return;

        const payload = buildInspectionPayload(values);
        mutation.mutate(payload, {
            onSuccess: () => {
                Swal.fire({ icon: 'success', title: 'Inspection submitted', text: 'The customer has been notified that a quote will follow.' });
            },
            onError: (error) => {
                Swal.fire({ icon: 'error', title: 'Could not submit inspection', text: submitErrorMessage(error) });
            },
        });
    };

    // Whole-taka only, and within the shared cap - reuses the same pure parser
    // the payload builder uses, so the UI rule and the wire format never drift.
    const estimateRule = {
        validate: (v) => parseEstimate(v).ok || `Enter a whole number of taka (0-${MAX_ESTIMATE_BDT}) or leave blank.`,
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
                <label className="label" htmlFor="diagnosisSummary">Diagnosis summary</label>
                <textarea
                    id="diagnosisSummary"
                    rows={4}
                    className={`textarea w-full ${errors.diagnosisSummary ? 'textarea-error' : ''}`}
                    placeholder="Describe what you found on inspection"
                    aria-invalid={errors.diagnosisSummary ? 'true' : 'false'}
                    {...register('diagnosisSummary', {
                        required: 'A diagnosis summary is required.',
                        minLength: { value: DIAGNOSIS_SUMMARY_MIN, message: `At least ${DIAGNOSIS_SUMMARY_MIN} characters.` },
                        maxLength: { value: DIAGNOSIS_SUMMARY_MAX, message: `At most ${DIAGNOSIS_SUMMARY_MAX} characters.` },
                    })}
                />
                {errors.diagnosisSummary && <p role="alert" className="text-red-500 text-sm">{errors.diagnosisSummary.message}</p>}
            </div>

            <DetectedIssuesEditor fields={fields} register={register} errors={errors} append={append} remove={remove} />

            <div>
                <label className="label" htmlFor="repairabilityDecision">Repairability</label>
                <select
                    id="repairabilityDecision"
                    defaultValue=""
                    className={`select w-full ${errors.repairabilityDecision ? 'select-error' : ''}`}
                    aria-invalid={errors.repairabilityDecision ? 'true' : 'false'}
                    {...register('repairabilityDecision', { required: 'Select a repairability decision.' })}>
                    <option value="" disabled>Select a decision</option>
                    {REPAIRABILITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                {errors.repairabilityDecision && <p role="alert" className="text-red-500 text-sm">{errors.repairabilityDecision.message}</p>}

                <label className="label mt-2" htmlFor="repairabilityReason">Reason</label>
                <textarea
                    id="repairabilityReason"
                    rows={3}
                    className={`textarea w-full ${errors.repairabilityReason ? 'textarea-error' : ''}`}
                    placeholder="Explain the repairability decision"
                    aria-invalid={errors.repairabilityReason ? 'true' : 'false'}
                    {...register('repairabilityReason', {
                        required: 'A reason is required.',
                        minLength: { value: REASON_MIN, message: `At least ${REASON_MIN} characters.` },
                        maxLength: { value: REASON_MAX, message: `At most ${REASON_MAX} characters.` },
                    })}
                />
                {errors.repairabilityReason && <p role="alert" className="text-red-500 text-sm">{errors.repairabilityReason.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="label" htmlFor="laborEstimate">Preliminary labor estimate (BDT)</label>
                    <input
                        id="laborEstimate"
                        type="number" min="0" step="1" inputMode="numeric"
                        className={`input w-full ${errors.laborEstimate ? 'input-error' : ''}`}
                        placeholder="Optional"
                        aria-invalid={errors.laborEstimate ? 'true' : 'false'}
                        {...register('laborEstimate', estimateRule)}
                    />
                    {errors.laborEstimate && <p role="alert" className="text-red-500 text-sm">{errors.laborEstimate.message}</p>}
                </div>
                <div>
                    <label className="label" htmlFor="partsEstimate">Preliminary parts estimate (BDT)</label>
                    <input
                        id="partsEstimate"
                        type="number" min="0" step="1" inputMode="numeric"
                        className={`input w-full ${errors.partsEstimate ? 'input-error' : ''}`}
                        placeholder="Optional"
                        aria-invalid={errors.partsEstimate ? 'true' : 'false'}
                        {...register('partsEstimate', estimateRule)}
                    />
                    {errors.partsEstimate && <p role="alert" className="text-red-500 text-sm">{errors.partsEstimate.message}</p>}
                </div>
            </div>
            <p className="text-sm opacity-70">This is a preliminary technician estimate, not a final quote or an amount to be paid now.</p>

            <div>
                <label className="label" htmlFor="internalNotes">Internal technician notes (optional)</label>
                <textarea
                    id="internalNotes"
                    rows={3}
                    className={`textarea w-full ${errors.internalNotes ? 'textarea-error' : ''}`}
                    placeholder="Notes for you and the admin team"
                    aria-describedby="internalNotes-help"
                    {...register('internalNotes', {
                        maxLength: { value: INTERNAL_NOTES_MAX, message: `At most ${INTERNAL_NOTES_MAX} characters.` },
                    })}
                />
                <p id="internalNotes-help" className="text-sm opacity-70">These notes are private to you and admins — the customer never sees them.</p>
                {errors.internalNotes && <p role="alert" className="text-red-500 text-sm">{errors.internalNotes.message}</p>}
            </div>

            <p aria-live="polite" className="sr-only">{busy ? 'Submitting inspection' : ''}</p>
            <button type="submit" disabled={busy} className="btn btn-primary">
                {busy ? 'Submitting...' : 'Submit inspection'}
            </button>
        </form>
    );
};

export default InspectionForm;
