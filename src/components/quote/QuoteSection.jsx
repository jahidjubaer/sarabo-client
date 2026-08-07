import { useQuote } from '../../hooks/useQuote';
import QuoteForm from './QuoteForm';
import QuoteSummary from './QuoteSummary';
import QuoteDecisionActions from './QuoteDecisionActions';

// Orchestrates the quote area inside the repair workspace (Phase 6.4 Unit 5).
// Server truth decides which of form / summary (+ owner decision) / hint shows;
// the server always re-authorizes. Redesigned to ds-* copy in 7.6A.
const QuoteSection = ({ requestId, isOwner, canSubmitQuote, isAssignedTechnicianView }) => {
    const { data: quote, isLoading, isError } = useQuote(requestId);

    if (isLoading) {
        return <p className="text-sm text-ds-muted-foreground" aria-busy="true">Loading quote…</p>;
    }
    if (isError || !quote) {
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
