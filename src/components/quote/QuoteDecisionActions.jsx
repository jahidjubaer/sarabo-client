import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { useDecideQuote } from '../../hooks/useQuoteMutations';
import { paymentKeys } from '../../hooks/paymentKeys';
import { createV2Checkout } from '../../api/payments';
import { formatMoney } from '../../utils/currency';
import { notify } from '../../lib/notify';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { validateRejectionReason, DECISION_REASON_MIN, DECISION_REASON_MAX } from '../../utils/quoteForm';

const DECISION_ERROR_COPY = {
    QUOTE_ALREADY_DECIDED: 'This quote has already been decided.',
    QUOTE_NOT_DECIDABLE: 'This quote is not awaiting a decision.',
    NOT_REQUEST_OWNER: 'Only the request owner can decide on a quote.',
    QUOTE_REJECTION_REASON_REQUIRED: 'A reason is required to decline a quote.',
    REQUEST_NOT_FOUND: 'This repair request is unavailable.',
};
function decisionErrorMessage(error) {
    return DECISION_ERROR_COPY[error?.response?.data?.code] || 'Could not record your decision. Please try again.';
}

// Approve / Decline controls (Phase 6.4 Unit 5), redesigned in 7.6A to use
// design-system dialogs instead of SweetAlert. The API payload and validation
// (validateRejectionReason, { decision, reason }) are unchanged; the server is
// always authoritative and revalidates ownership + one-decision-only.
//
// Approving is "approve and pay": once the quote is approved the customer goes
// straight to the card payment for what is left (final price minus the
// inspection fee). If the payment page can't open, the quote stays approved
// and the request's Pay button picks it up.
const QuoteDecisionActions = ({ requestId, quote }) => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const mutation = useDecideQuote(requestId);
    const [paying, setPaying] = useState(false);
    const busy = mutation.isPending || paying;
    const [approveOpen, setApproveOpen] = useState(false);
    const [declineOpen, setDeclineOpen] = useState(false);
    const currency = quote?.currency || 'BDT';
    const hasDue = quote?.amountDue !== null && quote?.amountDue !== undefined && Number.isFinite(Number(quote.amountDue));
    const due = hasDue ? Number(quote.amountDue) : Number(quote?.totalAmount);
    const dueText = formatMoney(due, currency);
    const nothingToPay = hasDue && due === 0;

    const startPayment = async () => {
        setPaying(true);
        try {
            const result = await createV2Checkout(axiosSecure, requestId);
            if (result.paidWithoutCharge) {
                setApproveOpen(false);
                setPaying(false);
                notify.success('Approved - your inspection fee covered the price. The repair can start.');
                queryClient.invalidateQueries({ queryKey: ['repair-requests', requestId] });
                queryClient.invalidateQueries({ queryKey: paymentKeys.all });
                return;
            }
            if (!result.url) throw new Error('missing checkout url');
            window.location.href = result.url;
        } catch {
            setApproveOpen(false);
            setPaying(false);
            notify.error("Quote approved, but the payment page couldn't open. Use the Pay button on this page.");
            queryClient.invalidateQueries({ queryKey: paymentKeys.all });
        }
    };

    const confirmApprove = () => {
        mutation.mutate({ decision: 'approve' }, {
            onSuccess: () => { startPayment(); },
            onError: (error) => { setApproveOpen(false); notify.error(decisionErrorMessage(error)); },
        });
    };

    const confirmDecline = (reason) => {
        mutation.mutate({ decision: 'reject', reason }, {
            onSuccess: () => { setDeclineOpen(false); notify.success('Quote declined - your technician has been notified.'); },
            onError: (error) => { setDeclineOpen(false); notify.error(decisionErrorMessage(error)); },
        });
    };

    return (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button variant="action" size="lg" onClick={() => setApproveOpen(true)} disabled={busy}>
                <Check aria-hidden="true" /> {nothingToPay ? 'Approve' : `Approve and pay ${dueText}`}
            </Button>
            <Button variant="outline" size="lg" onClick={() => setDeclineOpen(true)} disabled={busy}>
                <X aria-hidden="true" /> Decline
            </Button>

            <ConfirmDialog
                open={approveOpen}
                onOpenChange={setApproveOpen}
                title={nothingToPay ? 'Approve this price?' : 'Approve and pay?'}
                description={nothingToPay
                    ? 'Your inspection fee covers the whole price, so there is nothing more to pay. The repair starts straight away.'
                    : 'Next you pay by secure card payment (Stripe). The repair starts once it is paid.'}
                summary={(
                    <div className="flex items-baseline justify-between gap-4">
                        <span className="text-body-sm font-semibold text-ds-muted-foreground">Left to pay</span>
                        <span className="ds-numeric text-heading text-ds-foreground">{dueText}</span>
                    </div>
                )}
                confirmVariant="action"
                confirmLabel={paying ? 'Opening payment…' : nothingToPay ? 'Approve' : 'Approve and pay'}
                busy={busy}
                onConfirm={confirmApprove}
            />
            <ConfirmDialog
                open={declineOpen}
                onOpenChange={setDeclineOpen}
                title="Decline this quote?"
                description="Tell your technician why. They can send a revised quote or close the request; nothing is charged either way."
                confirmLabel="Decline quote"
                destructive
                busy={busy}
                reason
                reasonLabel={`Reason (${DECISION_REASON_MIN}-${DECISION_REASON_MAX} characters)`}
                reasonPlaceholder="Explain why you are declining this quote"
                validateReason={validateRejectionReason}
                onConfirm={confirmDecline}
            />
        </div>
    );
};

export default QuoteDecisionActions;
