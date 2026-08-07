import { formatMoney } from '../../utils/currency';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';

// Read-only quote render (Phase 6.4 Unit 5) redesigned in 7.6A as a compact
// invoice-like breakdown. All amounts come straight from the server-owned quote
// (BDT, server-computed total). No payment control is ever rendered here.
const STATUS = {
    submitted: { label: 'Awaiting your decision', tone: 'warning' },
    approved: { label: 'Approved', tone: 'success' },
    rejected: { label: 'Declined', tone: 'danger' },
};

function money(amount, currency) {
    if (typeof amount !== 'number') return '—';
    return formatMoney(amount, currency || 'BDT') || `${amount}`;
}

function Line({ label, value, strong }) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className={strong ? 'font-semibold text-ds-foreground' : 'text-ds-muted-foreground'}>{label}</span>
            <span className={strong ? 'font-semibold text-ds-foreground tabular-nums' : 'text-ds-foreground tabular-nums'}>{value}</span>
        </div>
    );
}

const QuoteSummary = ({ quote }) => {
    if (!quote || !quote.status || quote.status === 'not_submitted') return null;
    const { currency } = quote;
    const status = STATUS[quote.status] || { label: quote.status, tone: 'neutral' };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ds-foreground">Repair quote</span>
                <Badge tone={status.tone}>{status.label}</Badge>
            </div>

            <div className="rounded-ds-lg border border-ds-border p-4">
                <div className="space-y-2">
                    <Line label="Labor" value={money(quote.laborAmount, currency)} />
                    <Line label="Parts" value={money(quote.partsAmount, currency)} />
                    <Line label="Additional charges" value={money(quote.additionalCharges, currency)} />
                </div>
                <Separator className="my-3" />
                <Line label="Total" value={money(quote.totalAmount, currency)} strong />
            </div>

            {quote.notes && (
                <div>
                    <h4 className="text-sm font-semibold text-ds-foreground">Notes</h4>
                    <p className="whitespace-pre-line text-sm text-ds-muted-foreground">{quote.notes}</p>
                </div>
            )}

            {quote.submittedAt && <p className="text-xs text-ds-muted-foreground">Quoted on {formatAbsoluteDateTime(quote.submittedAt)}</p>}
            {quote.decidedAt && (
                <p className="text-xs text-ds-muted-foreground">
                    {quote.status === 'approved' ? 'Approved' : 'Declined'} on {formatAbsoluteDateTime(quote.decidedAt)}
                    {quote.status === 'rejected' && quote.decisionReason ? ` — ${quote.decisionReason}` : ''}
                </p>
            )}
            <p className="text-xs text-ds-muted-foreground">Payment becomes available after the quote is approved.</p>
        </div>
    );
};

export default QuoteSummary;
