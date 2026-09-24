import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useDecideQuote } from '../../hooks/useQuoteMutations';
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
const QuoteDecisionActions = ({ requestId, total }) => {
    const mutation = useDecideQuote(requestId);
    const busy = mutation.isPending;
    const [approveOpen, setApproveOpen] = useState(false);
    const [declineOpen, setDeclineOpen] = useState(false);

    const confirmApprove = () => {
        mutation.mutate({ decision: 'approve' }, {
            onSuccess: () => { setApproveOpen(false); notify.success('Quote approved - your technician has been notified.'); },
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
                <Check aria-hidden="true" /> Approve quote
            </Button>
            <Button variant="outline" size="lg" onClick={() => setDeclineOpen(true)} disabled={busy}>
                <X aria-hidden="true" /> Decline
            </Button>

            <ConfirmDialog
                open={approveOpen}
                onOpenChange={setApproveOpen}
                title="Approve this quote?"
                description="You pay next, by secure card payment. The repair starts once payment is confirmed."
                summary={total ? (
                    <div className="flex items-baseline justify-between gap-4">
                        <span className="text-body-sm font-semibold text-ds-muted-foreground">Total to pay</span>
                        <span className="ds-numeric text-heading text-ds-foreground">{total}</span>
                    </div>
                ) : null}
                confirmVariant="action"
                confirmLabel="Approve quote"
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
