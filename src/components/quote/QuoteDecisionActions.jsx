import Swal from 'sweetalert2';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useDecideQuote } from '../../hooks/useQuoteMutations';
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

// Approve / Decline controls, shown to the request owner only while the quote
// is awaiting a decision (QuoteSection gates this). The server is always
// authoritative and revalidates ownership + one-decision-only.
const QuoteDecisionActions = ({ requestId }) => {
    const mutation = useDecideQuote(requestId);
    const busy = mutation.isPending;

    const approve = async () => {
        if (busy) return;
        const confirm = await Swal.fire({
            title: 'Approve this quote?', text: 'This confirms you accept the quoted repair cost.',
            icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, approve',
        });
        if (!confirm.isConfirmed) return;
        mutation.mutate({ decision: 'approve' }, {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Quote approved', text: 'Your technician has been notified.' }),
            onError: (error) => Swal.fire({ icon: 'error', title: 'Could not approve', text: decisionErrorMessage(error) }),
        });
    };

    const reject = async () => {
        if (busy) return;
        const result = await Swal.fire({
            title: 'Decline this quote?',
            input: 'textarea',
            inputLabel: `Reason (${DECISION_REASON_MIN}-${DECISION_REASON_MAX} characters)`,
            inputPlaceholder: 'Let the technician know why you are declining',
            showCancelButton: true, confirmButtonText: 'Decline quote',
            inputValidator: (value) => {
                const check = validateRejectionReason(value);
                return check.valid ? undefined : check.message;
            },
        });
        if (!result.isConfirmed) return;
        mutation.mutate({ decision: 'reject', reason: result.value.trim() }, {
            onSuccess: () => Swal.fire({ icon: 'success', title: 'Quote declined', text: 'Your technician has been notified.' }),
            onError: (error) => Swal.fire({ icon: 'error', title: 'Could not decline', text: decisionErrorMessage(error) }),
        });
    };

    return (
        <div className="flex flex-wrap gap-3 mt-3">
            <button type="button" onClick={approve} disabled={busy} className="btn btn-success">
                <FaCheck aria-hidden="true" /> {busy ? 'Working…' : 'Approve Quote'}
            </button>
            <button type="button" onClick={reject} disabled={busy} className="btn btn-outline btn-error">
                <FaTimes aria-hidden="true" /> Decline Quote
            </button>
        </div>
    );
};

export default QuoteDecisionActions;
