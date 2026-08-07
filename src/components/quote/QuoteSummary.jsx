import { formatMoney } from '../../utils/currency';

// Read-only quote render (Phase 6.4 Unit 5). Shown to the customer, admin, and
// assigned technician. No payment control is ever rendered here - approving a
// quote does not make it payable in this unit. All amounts come straight from
// the server-owned quote (BDT, server-computed total).
const STATUS_LABEL = {
    submitted: 'Awaiting your decision',
    approved: 'Approved',
    rejected: 'Declined',
};
const STATUS_BADGE = {
    submitted: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-error',
};

function money(amount, currency) {
    if (typeof amount !== 'number') return '—';
    return formatMoney(amount, currency || 'BDT') || `${amount}`;
}
function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

const QuoteSummary = ({ quote }) => {
    if (!quote || !quote.status || quote.status === 'not_submitted') return null;
    const { currency } = quote;

    return (
        <div className="space-y-3">
            <p>
                <span className="font-semibold">Status:</span>{' '}
                <span className={`badge ${STATUS_BADGE[quote.status] || 'badge-ghost'}`}>{STATUS_LABEL[quote.status] || quote.status}</span>
            </p>

            <div className="rounded-lg bg-base-200 p-3 space-y-1">
                <p><span className="opacity-70">Labor:</span> {money(quote.laborAmount, currency)}</p>
                <p><span className="opacity-70">Parts:</span> {money(quote.partsAmount, currency)}</p>
                <p><span className="opacity-70">Additional charges:</span> {money(quote.additionalCharges, currency)}</p>
                <p className="font-semibold border-t border-base-300 pt-1 mt-1"><span className="opacity-70 font-normal">Total:</span> {money(quote.totalAmount, currency)}</p>
            </div>

            {quote.notes && (
                <div>
                    <h4 className="font-semibold">Notes</h4>
                    <p className="text-sm opacity-80 whitespace-pre-line">{quote.notes}</p>
                </div>
            )}

            {quote.submittedAt && <p className="text-sm opacity-70">Quoted on {formatDate(quote.submittedAt)}</p>}
            {quote.decidedAt && (
                <p className="text-sm opacity-70">
                    {quote.status === 'approved' ? 'Approved' : 'Declined'} on {formatDate(quote.decidedAt)}
                    {quote.status === 'rejected' && quote.decisionReason ? ` — ${quote.decisionReason}` : ''}
                </p>
            )}

            <p className="text-sm opacity-70">This quote is not payable yet — payment will be enabled in a later step.</p>
        </div>
    );
};

export default QuoteSummary;
