import { useQueryClient } from '@tanstack/react-query';
import { useQuote } from '../../hooks/useQuote';
import { quoteKeys } from '../../hooks/quoteKeys';
import { Button } from '../ui/button';
import QuoteForm from './QuoteForm';
import QuoteSummary from './QuoteSummary';
import QuoteDecisionActions from './QuoteDecisionActions';
import { formatMoney } from '../../utils/currency';

// The money after the inspection, in one place: the final price, the
// inspection fee already paid (it counts toward the price) and what is left
// to pay. The server works out both amounts (GET /quote); nothing is computed
// here. Shown to the customer before they decide.
function AmountDue({ quote }) {
    const currency = quote.currency || 'BDT';
    const credit = Number(quote.inspectionCredit) || 0;
    if (quote.amountDue === null || quote.amountDue === undefined || !Number.isFinite(Number(quote.amountDue))) return null;
    return (
        <dl className="mt-4 space-y-1.5 rounded-ds-lg bg-ds-muted p-4 text-body-sm">
            <div className="flex justify-between gap-4">
                <dt className="text-ds-muted-foreground">Final price</dt>
                <dd className="ds-numeric text-ds-foreground">{formatMoney(quote.totalAmount, currency)}</dd>
            </div>
            {credit > 0 && (
                <div className="flex justify-between gap-4">
                    <dt className="text-ds-muted-foreground">Inspection fee you already paid</dt>
                    <dd className="ds-numeric text-ds-foreground">- {formatMoney(credit, currency)}</dd>
                </div>
            )}
            <div className="flex justify-between gap-4 border-t border-ds-border pt-1.5">
                <dt className="font-semibold text-ds-foreground">Left to pay</dt>
                <dd className="ds-numeric font-semibold text-ds-foreground">{formatMoney(quote.amountDue, currency)}</dd>
            </div>
            <p className="pt-1 text-micro text-ds-muted-foreground">
                {Number(quote.amountDue) > 0
                    ? 'If you approve, you pay this straight away by card. The repair starts once it is paid. Nothing else is charged later.'
                    : 'Your inspection fee covers the whole price - approve and the repair starts, nothing more to pay.'}
            </p>
        </dl>
    );
}

// Orchestrates the quote area inside the repair workspace (Phase 6.4 Unit 5).
// Server truth decides which of form / summary (+ owner decision) / hint shows;
// the server always re-authorizes. Redesigned to ds-* copy in 7.6A.
const QuoteSection = ({ requestId, isOwner, canSubmitQuote, isAssignedTechnicianView }) => {
    const audience = isOwner ? 'customer' : isAssignedTechnicianView ? 'technician' : 'admin';
    const queryClient = useQueryClient();
    const { data: quote, isLoading, isPaused, isError } = useQuote(requestId);
    const hasUsableQuote = quote !== undefined && quote !== null;
    const isInitialLoading = isLoading && !hasUsableQuote;
    const isUnavailableBeforeData = isPaused && !hasUsableQuote;
    const isReadErrorBeforeData = isError && !hasUsableQuote;
    const retryQuote = () => queryClient.resetQueries({ queryKey: quoteKeys.request(requestId) });

    if (isInitialLoading) {
        return <p className="text-sm text-ds-muted-foreground" aria-busy="true">Loading quote…</p>;
    }
    if (isUnavailableBeforeData || isReadErrorBeforeData) {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-ds-muted-foreground">Quote details are unavailable right now.</p>
                <Button variant="ghost" size="sm" onClick={retryQuote}>Try again</Button>
            </div>
        );
    }
    if (!quote) {
        return <p className="text-sm text-ds-muted-foreground">Quote details are unavailable right now.</p>;
    }
    if (quote.status === 'submitted') {
        return (
            <div>
                <QuoteSummary quote={quote} audience={audience} />
                {isOwner && <AmountDue quote={quote} />}
                {isOwner && <QuoteDecisionActions requestId={requestId} quote={quote} />}
            </div>
        );
    }
    if (quote.status === 'approved' || quote.status === 'rejected') {
        return <QuoteSummary quote={quote} audience={audience} />;
    }
    if (canSubmitQuote) {
        return <QuoteForm requestId={requestId} />;
    }
    if (isAssignedTechnicianView) {
        return <p className="text-sm text-ds-muted-foreground">You can submit a quote once the inspection is completed.</p>;
    }
    return <p className="text-sm text-ds-muted-foreground">No repair quote has been prepared yet.</p>;
};

export default QuoteSection;
