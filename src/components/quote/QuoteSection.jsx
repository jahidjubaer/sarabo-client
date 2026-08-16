import { useQueryClient } from '@tanstack/react-query';
import { useQuote } from '../../hooks/useQuote';
import { quoteKeys } from '../../hooks/quoteKeys';
import { Button } from '../ui/button';
import QuoteForm from './QuoteForm';
import QuoteSummary from './QuoteSummary';
import QuoteDecisionActions from './QuoteDecisionActions';

// Orchestrates the quote area inside the repair workspace (Phase 6.4 Unit 5).
// Server truth decides which of form / summary (+ owner decision) / hint shows;
// the server always re-authorizes. Redesigned to ds-* copy in 7.6A.
const QuoteSection = ({ requestId, isOwner, canSubmitQuote, isAssignedTechnicianView }) => {
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
                <QuoteSummary quote={quote} />
                {isOwner && <QuoteDecisionActions requestId={requestId} />}
            </div>
        );
    }
    if (quote.status === 'approved' || quote.status === 'rejected') {
        return <QuoteSummary quote={quote} />;
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
