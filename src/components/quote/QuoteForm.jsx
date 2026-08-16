import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { formatMoney } from '../../utils/currency';
import { useSubmitQuote } from '../../hooks/useQuoteMutations';
import { notify } from '../../lib/notify';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { LoadingButton } from '../common/LoadingButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
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

const amountRule = { validate: (v) => parseAmount(v, { required: true }).ok || `Enter a whole number of taka (0-${MAX_LINE_AMOUNT_BDT}).` };
const optionalAmountRule = { validate: (v) => parseAmount(v).ok || `Enter a whole number of taka (0-${MAX_LINE_AMOUNT_BDT}) or leave blank.` };

// Technician quote form (Phase 6.4 Unit 5) redesigned in 7.6A. Same fields,
// same validation, same buildQuotePayload/useSubmitQuote wiring. The live total
// is UX-only - the server always recomputes the authoritative total on submit.
const QuoteForm = ({ requestId }) => {
    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { laborAmount: '', partsAmount: '', additionalCharges: '', notes: '' },
    });
    const mutation = useSubmitQuote(requestId);
    const [pendingValues, setPendingValues] = useState(null);
    const busy = isSubmitting || mutation.isPending;

    const watched = useWatch({ control });
    const previewTotal = computeTotal(watched || {});

    const onValid = (values) => { if (!busy) setPendingValues(values); };

    const confirmSubmit = () => {
        const values = pendingValues;
        if (!values) return;
        mutation.mutate(buildQuotePayload(values), {
            onSuccess: () => { setPendingValues(null); notify.success('Quote submitted - the customer will be notified to review it.'); },
            onError: (error) => { setPendingValues(null); notify.error(submitErrorMessage(error)); },
        });
    };

    return (
        <>
            <form onSubmit={handleSubmit(onValid)} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="laborAmount">Labor (BDT)</Label>
                        <Input id="laborAmount" type="number" min="0" step="1" inputMode="numeric"
                            aria-invalid={errors.laborAmount ? 'true' : 'false'} aria-describedby={errors.laborAmount ? 'laborAmount-error' : undefined} {...register('laborAmount', amountRule)} />
                        {errors.laborAmount && <p id="laborAmount-error" role="alert" className="text-xs font-medium text-ds-destructive">{errors.laborAmount.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="partsAmount">Parts (BDT)</Label>
                        <Input id="partsAmount" type="number" min="0" step="1" inputMode="numeric"
                            aria-invalid={errors.partsAmount ? 'true' : 'false'} aria-describedby={errors.partsAmount ? 'partsAmount-error' : undefined} {...register('partsAmount', amountRule)} />
                        {errors.partsAmount && <p id="partsAmount-error" role="alert" className="text-xs font-medium text-ds-destructive">{errors.partsAmount.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="additionalCharges">Additional (BDT)</Label>
                        <Input id="additionalCharges" type="number" min="0" step="1" inputMode="numeric" placeholder="Optional"
                            aria-invalid={errors.additionalCharges ? 'true' : 'false'} aria-describedby={errors.additionalCharges ? 'additionalCharges-error' : undefined} {...register('additionalCharges', optionalAmountRule)} />
                        {errors.additionalCharges && <p id="additionalCharges-error" role="alert" className="text-xs font-medium text-ds-destructive">{errors.additionalCharges.message}</p>}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-ds border border-ds-border bg-ds-muted/40 p-3">
                    <span className="text-sm text-ds-muted-foreground">Estimated total</span>
                    <span className="text-lg font-semibold text-ds-foreground tabular-nums" aria-live="polite">
                        {previewTotal === null ? '—' : formatMoney(previewTotal, 'BDT')}
                    </span>
                </div>
                <p className="-mt-2 text-xs text-ds-muted-foreground">The server confirms the final total from these line items.</p>

                <div className="space-y-1.5">
                    <Label htmlFor="quoteNotes">Notes (optional)</Label>
                    <Textarea id="quoteNotes" rows={3} placeholder="Anything the customer should know about this quote"
                        aria-invalid={errors.notes ? 'true' : 'false'}
                        aria-describedby={errors.notes ? 'notes-error' : undefined}
                        {...register('notes', { maxLength: { value: NOTES_MAX, message: `At most ${NOTES_MAX} characters.` } })} />
                    {errors.notes && <p id="notes-error" role="alert" className="text-xs font-medium text-ds-destructive">{errors.notes.message}</p>}
                </div>

                <LoadingButton type="submit" loading={busy} loadingText="Submitting…">Submit quote</LoadingButton>
            </form>

            <ConfirmDialog
                open={!!pendingValues}
                onOpenChange={(open) => { if (!open) setPendingValues(null); }}
                title="Submit quote?"
                description="The customer will be asked to approve or decline this quote."
                confirmLabel="Submit quote"
                busy={mutation.isPending}
                onConfirm={confirmSubmit}
            />
        </>
    );
};

export default QuoteForm;
