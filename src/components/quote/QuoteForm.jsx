import { useForm, useWatch } from 'react-hook-form';
import Swal from 'sweetalert2';
import { formatMoney } from '../../utils/currency';
import { useSubmitQuote } from '../../hooks/useQuoteMutations';
import { MAX_LINE_AMOUNT_BDT, NOTES_MAX, computeTotal, buildQuotePayload, parseAmount } from '../../utils/quoteForm';

const SUBMIT_ERROR_COPY = {
    QUOTE_ALREADY_SUBMITTED: 'A quote has already been submitted for this request.',
    QUOTE_NOT_ALLOWED: 'A quote can only be submitted after the inspection is completed.',
    TECHNICIAN_ROLE_REQUIRED: 'Only the assigned technician can submit a quote.',
    REQUEST_NOT_ASSIGNED_TO_TECHNICIAN: 'This request is no longer assigned to you.',
    REQUEST_NOT_FOUND: 'This repair request is unavailable.',
    LEGACY_REQUEST_NOT_SUPPORTED: 'Quotes are only available for newer repair requests.',
    INVALID_QUOTE: 'Please review the quote and try again.',
    INVALID_QUOTE_AMOUNT: 'Please review the amounts and try again.',
};

function submitErrorMessage(error) {
    return SUBMIT_ERROR_COPY[error?.response?.data?.code] || 'Could not submit the quote. Please try again.';
}

const amountRule = {
    validate: (v) => parseAmount(v, { required: true }).ok || `Enter a whole number of taka (0-${MAX_LINE_AMOUNT_BDT}).`,
};
const optionalAmountRule = {
    validate: (v) => parseAmount(v).ok || `Enter a whole number of taka (0-${MAX_LINE_AMOUNT_BDT}) or leave blank.`,
};

const QuoteForm = ({ requestId }) => {
    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { laborAmount: '', partsAmount: '', additionalCharges: '', notes: '' },
    });
    const mutation = useSubmitQuote(requestId);
    const busy = isSubmitting || mutation.isPending;

    // Local, UX-only running total - the server always recomputes the
    // authoritative total from the line items on submit.
    const watched = useWatch({ control });
    const previewTotal = computeTotal(watched || {});

    const onSubmit = async (values) => {
        if (busy) return;
        const confirm = await Swal.fire({
            title: 'Submit quote?',
            text: 'The customer will be asked to approve or decline this quote.',
            icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, submit',
        });
        if (!confirm.isConfirmed) return;

        mutation.mutate(buildQuotePayload(values), {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Quote submitted', text: 'The customer has been notified to review it.' }),
            onError: (error) => Swal.fire({ icon: 'error', title: 'Could not submit quote', text: submitErrorMessage(error) }),
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label className="label" htmlFor="laborAmount">Labor (BDT)</label>
                    <input id="laborAmount" type="number" min="0" step="1" inputMode="numeric"
                        className={`input w-full ${errors.laborAmount ? 'input-error' : ''}`}
                        aria-invalid={errors.laborAmount ? 'true' : 'false'} {...register('laborAmount', amountRule)} />
                    {errors.laborAmount && <p role="alert" className="text-red-500 text-sm">{errors.laborAmount.message}</p>}
                </div>
                <div>
                    <label className="label" htmlFor="partsAmount">Parts (BDT)</label>
                    <input id="partsAmount" type="number" min="0" step="1" inputMode="numeric"
                        className={`input w-full ${errors.partsAmount ? 'input-error' : ''}`}
                        aria-invalid={errors.partsAmount ? 'true' : 'false'} {...register('partsAmount', amountRule)} />
                    {errors.partsAmount && <p role="alert" className="text-red-500 text-sm">{errors.partsAmount.message}</p>}
                </div>
                <div>
                    <label className="label" htmlFor="additionalCharges">Additional (BDT)</label>
                    <input id="additionalCharges" type="number" min="0" step="1" inputMode="numeric"
                        className={`input w-full ${errors.additionalCharges ? 'input-error' : ''}`}
                        placeholder="Optional"
                        aria-invalid={errors.additionalCharges ? 'true' : 'false'} {...register('additionalCharges', optionalAmountRule)} />
                    {errors.additionalCharges && <p role="alert" className="text-red-500 text-sm">{errors.additionalCharges.message}</p>}
                </div>
            </div>

            <p className="font-semibold" aria-live="polite">
                Estimated total: {previewTotal === null ? '—' : formatMoney(previewTotal, 'BDT')}
                <span className="font-normal text-sm opacity-70"> (server confirms the final total)</span>
            </p>

            <div>
                <label className="label" htmlFor="quoteNotes">Notes (optional)</label>
                <textarea id="quoteNotes" rows={3} className={`textarea w-full ${errors.notes ? 'textarea-error' : ''}`}
                    placeholder="Anything the customer should know about this quote"
                    {...register('notes', { maxLength: { value: NOTES_MAX, message: `At most ${NOTES_MAX} characters.` } })} />
                {errors.notes && <p role="alert" className="text-red-500 text-sm">{errors.notes.message}</p>}
            </div>

            <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Submitting…' : 'Submit quote'}</button>
        </form>
    );
};

export default QuoteForm;
