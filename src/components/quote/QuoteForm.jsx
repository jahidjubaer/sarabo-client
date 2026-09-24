import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Info } from 'lucide-react';
import { formatMoney } from '../../utils/currency';
import { useSubmitQuote } from '../../hooks/useQuoteMutations';
import { useInspection } from '../../hooks/useInspection';
import { useTechnicianWallet } from '../../hooks/useTechnicianWallet';
import { notify } from '../../lib/notify';
import { MoneyInput } from '../ui/money-input';
import { Textarea } from '../ui/textarea';
import { FormField } from '../common/FormField';
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
const isPositiveWhole = (value) => typeof value === 'number' && Number.isInteger(value) && value >= 0;

// Technician quote form (Phase 4). Same fields, same validation, same
// buildQuotePayload / useSubmitQuote wiring as before. Two conveniences:
//   - labour and parts are pre-filled from the technician's own inspection
//     estimate (once, and only into empty fields), so nothing is typed twice;
//   - a payout preview shows what the technician receives after the platform
//     commission, using the rate from their wallet.
// Both are display-only: the server recomputes the total and the settlement.
const QuoteForm = ({ requestId }) => {
    const { register, handleSubmit, control, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { laborAmount: '', partsAmount: '', additionalCharges: '', notes: '' },
    });
    const mutation = useSubmitQuote(requestId);
    const { data: inspection } = useInspection(requestId);
    const { data: wallet } = useTechnicianWallet();
    const [pendingValues, setPendingValues] = useState(null);
    const prefillDone = useRef(false);
    const busy = isSubmitting || mutation.isPending;

    useEffect(() => {
        if (prefillDone.current) return;
        const estimate = inspection?.estimate;
        if (!estimate) return;
        prefillDone.current = true;
        if (isPositiveWhole(estimate.laborEstimate) && !getValues('laborAmount')) setValue('laborAmount', String(estimate.laborEstimate));
        if (isPositiveWhole(estimate.partsEstimate) && !getValues('partsAmount')) setValue('partsAmount', String(estimate.partsEstimate));
    }, [inspection, getValues, setValue]);

    const watched = useWatch({ control });
    // The note shows while a field still holds the inspection estimate.
    const estimate = inspection?.estimate;
    const prefilled = Boolean(estimate) && (
        (isPositiveWhole(estimate.laborEstimate) && watched?.laborAmount === String(estimate.laborEstimate))
        || (isPositiveWhole(estimate.partsEstimate) && watched?.partsAmount === String(estimate.partsEstimate))
    );
    const previewTotal = computeTotal(watched || {});
    const rate = typeof wallet?.commissionRate === 'number' ? wallet.commissionRate : null;
    const commission = previewTotal !== null && rate !== null ? Math.round(previewTotal * rate) : null;
    const receive = commission !== null ? previewTotal - commission : null;
    const ratePercent = rate !== null ? Number((rate * 100).toFixed(2)) : null;

    const onValid = (values) => { if (!busy) setPendingValues(values); };

    const confirmSubmit = () => {
        const values = pendingValues;
        if (!values) return;
        mutation.mutate(buildQuotePayload(values), {
            onSuccess: () => { setPendingValues(null); notify.success('Quote sent. The customer will be asked to approve it.'); },
            onError: (error) => { setPendingValues(null); notify.error(submitErrorMessage(error)); },
        });
    };

    const pendingTotal = pendingValues ? computeTotal(pendingValues) : null;

    return (
        <>
            <form onSubmit={handleSubmit(onValid)} className="space-y-5" noValidate>
                {prefilled && (
                    <p className="flex items-start gap-2 rounded-ds-lg bg-ds-accent p-3 text-body-sm text-ds-accent-foreground">
                        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        Pre-filled from your inspection estimate. Change anything that is different.
                    </p>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField id="laborAmount" label="Labour (BDT)" required error={errors.laborAmount?.message}>
                        <MoneyInput id="laborAmount" inputMode="numeric" {...register('laborAmount', amountRule)} />
                    </FormField>
                    <FormField id="partsAmount" label="Parts (BDT)" required error={errors.partsAmount?.message}>
                        <MoneyInput id="partsAmount" inputMode="numeric" {...register('partsAmount', amountRule)} />
                    </FormField>
                    <FormField id="additionalCharges" label="Additional (BDT)" hint="Optional" error={errors.additionalCharges?.message}>
                        <MoneyInput id="additionalCharges" inputMode="numeric" placeholder="0" {...register('additionalCharges', optionalAmountRule)} />
                    </FormField>
                </div>

                <dl className="space-y-2 rounded-ds-lg bg-ds-muted p-4">
                    <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-body font-bold text-ds-foreground">Customer pays</dt>
                        <dd className="ds-numeric text-heading text-ds-foreground">{previewTotal === null ? '—' : formatMoney(previewTotal, 'BDT')}</dd>
                    </div>
                    {ratePercent !== null && (
                        <>
                            <div className="flex items-baseline justify-between gap-3 text-body-sm text-ds-muted-foreground">
                                <dt>Platform commission ({ratePercent}%)</dt>
                                <dd className="ds-numeric">{commission === null ? '—' : `−${formatMoney(commission, 'BDT')}`}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3 border-t border-ds-border pt-2">
                                <dt className="text-body-sm font-bold text-ds-success-subtle-foreground">You receive</dt>
                                <dd className="ds-numeric text-subhead text-ds-success-subtle-foreground">{receive === null ? '—' : formatMoney(receive, 'BDT')}</dd>
                            </div>
                        </>
                    )}
                </dl>
                <p className="-mt-3 text-micro text-ds-muted-foreground">Sarabo confirms the final amounts from these line items.</p>

                <FormField id="quoteNotes" label="Notes for the customer" hint={`Optional. Up to ${NOTES_MAX} characters.`} error={errors.notes?.message}>
                    <Textarea
                        id="quoteNotes"
                        rows={3}
                        placeholder="Anything the customer should know about this quote"
                        {...register('notes', { maxLength: { value: NOTES_MAX, message: `At most ${NOTES_MAX} characters.` } })}
                    />
                </FormField>

                <LoadingButton type="submit" variant="action" size="lg" loading={busy} loadingText="Sending…">Send quote</LoadingButton>
            </form>

            <ConfirmDialog
                open={!!pendingValues}
                onOpenChange={(open) => { if (!open) setPendingValues(null); }}
                title="Send this quote?"
                description="The customer will be asked to approve or decline it. You cannot edit it after sending."
                summary={pendingTotal !== null ? (
                    <div className="flex items-baseline justify-between gap-4">
                        <span className="text-body-sm font-semibold text-ds-muted-foreground">Quote total</span>
                        <span className="ds-numeric text-heading text-ds-foreground">{formatMoney(pendingTotal, 'BDT')}</span>
                    </div>
                ) : null}
                confirmVariant="action"
                confirmLabel="Send quote"
                busy={mutation.isPending}
                onConfirm={confirmSubmit}
            />
        </>
    );
};

export default QuoteForm;
