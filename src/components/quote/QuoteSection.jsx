import { useQuote } from '../../hooks/useQuote';
import QuoteForm from './QuoteForm';
import QuoteSummary from './QuoteSummary';
import QuoteDecisionActions from './QuoteDecisionActions';

// Orchestrates the quote area inside RequestDetails (Phase 6.4 Unit 5).
// Rendered only for v2 requests. Decides, from server truth, whether to show
// the technician form, the read-only summary (+ owner decision actions while
// awaiting a decision), or a neutral placeholder. The server always
// re-authorizes and re-validates.
//
//  - submitted            -> summary + (owner only) approve/decline actions
//  - approved / rejected  -> summary (final state)
//  - not submitted + eligible technician -> submission form
//  - not submitted + assigned technician, wrong stage -> hint
//  - not submitted + customer/admin -> "no quote yet" note
const QuoteSection = ({ requestId, isOwner, canSubmitQuote, isAssignedTechnicianView }) => {
    const { data: quote, isLoading, isError } = useQuote(requestId);

    if (isLoading) {
        return <p className="opacity-70 text-sm" aria-busy="true">Loading quote…</p>;
    }
    if (isError || !quote) {
        return <p className="opacity-70 text-sm">Quote details are unavailable right now.</p>;
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

    // No quote yet.
    if (canSubmitQuote) {
        return <QuoteForm requestId={requestId} />;
    }
    if (isAssignedTechnicianView) {
        return <p className="opacity-70 text-sm">You can submit a quote once the inspection is completed.</p>;
    }
    return <p className="opacity-70 text-sm">No repair quote has been prepared yet.</p>;
};

export default QuoteSection;
