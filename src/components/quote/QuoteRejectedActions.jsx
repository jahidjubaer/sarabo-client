import { useState } from 'react';
import { RotateCcw, Ban } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { notify } from '../../lib/notify';
import { useReviseQuote, useCancelAfterQuoteRejection } from '../../hooks/useQuoteMutations';

// What the assigned technician can do after a customer declines their quote
// (Phase 9.2).
//
// This panel exists because declining used to be a dead end: the request sat at
// quote_rejected with no technician action of any kind, while still occupying
// the technician's one active-assignment slot. Both routes out are offered here
// and nowhere else.
//
// Server authority is unchanged - it re-checks assigned-technician identity,
// v2, not-already-paid and quote_rejected on both endpoints. This component
// only decides whether to OFFER the actions.

const ERROR_COPY = {
    QUOTE_NOT_REJECTED: 'This request is no longer awaiting a decision on a declined quote.',
    REQUEST_ALREADY_PAID: 'This repair has already been paid for and cannot be changed here.',
    TECHNICIAN_ROLE_REQUIRED: 'Only the assigned technician can do this.',
    CANCELLATION_NOT_ALLOWED: 'This request can no longer be cancelled.',
    REQUEST_NOT_FOUND: 'This repair request is no longer available.',
};

function errorMessage(error, fallback) {
    const data = error?.response?.data;
    return ERROR_COPY[data?.code] || data?.message || fallback;
}

function QuoteRejectedActions({ requestId }) {
    const [confirming, setConfirming] = useState(null);
    const revise = useReviseQuote(requestId);
    const cancel = useCancelAfterQuoteRejection(requestId);
    const busy = revise.isPending || cancel.isPending;

    const handleConfirm = () => {
        if (confirming === 'revise') {
            revise.mutate(undefined, {
                onSuccess: () => {
                    setConfirming(null);
                    notify.success('Quote reopened. You can submit a revised quote now.');
                },
                onError: (error) => notify.error(errorMessage(error, 'Could not reopen the quote. Please try again.')),
            });
            return;
        }
        cancel.mutate(undefined, {
            onSuccess: () => {
                setConfirming(null);
                notify.success('Repair request cancelled.');
            },
            onError: (error) => notify.error(errorMessage(error, 'Could not cancel the request. Please try again.')),
        });
    };

    const isRevise = confirming === 'revise';

    return (
        <>
            <Card className="border-ds-warning/40 bg-ds-warning/5">
                <CardContent className="space-y-4 p-5 sm:p-6">
                    <div>
                        <p className="ds-label text-ds-muted-foreground">Customer declined the quote</p>
                        <h2 className="mt-1 text-base font-semibold text-ds-foreground">Decide what happens next</h2>
                        <p className="mt-1 max-w-2xl text-sm text-ds-muted-foreground">
                            You can look at the repair again and send a revised quote, or cancel the
                            request if the work is not worth doing at a price the customer will accept.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="action" size="sm" disabled={busy} onClick={() => setConfirming('revise')}>
                            <RotateCcw aria-hidden="true" /> Revise the quote
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => setConfirming('cancel')}
                            className="text-ds-destructive hover:text-ds-destructive"
                        >
                            <Ban aria-hidden="true" /> Cancel request
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <ConfirmDialog
                open={confirming !== null}
                onOpenChange={(next) => { if (!next) setConfirming(null); }}
                title={isRevise ? 'Reopen this quote for revision?' : 'Cancel this repair request?'}
                description={isRevise
                    ? 'The declined quote is kept on record and the request returns to the quoting stage, where you can submit a new quote. The customer reviews the new quote before anything is charged.'
                    : 'The request is cancelled and the customer is told. This cannot be undone.'}
                confirmLabel={isRevise ? 'Reopen for revision' : 'Cancel request'}
                destructive={!isRevise}
                busy={busy}
                onConfirm={handleConfirm}
            />
        </>
    );
}

export default QuoteRejectedActions;
