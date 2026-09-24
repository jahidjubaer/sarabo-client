import { formatMoney } from '../../utils/currency';
import { Separator } from '../ui/separator';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';

// Read-only quote render (Phase 6.4 Unit 5) redesigned in 7.6A as a compact
// invoice-like breakdown. All amounts come straight from the server-owned quote
// (BDT, server-computed total). No payment control is ever rendered here.
// `audience` is who is looking (customer | technician | admin). Only the
// customer decides a submitted quote, so only they see "Awaiting your
// decision" in the action tone and the note about payment; everyone else sees
// that the customer is deciding.
const STATUS = {
    submitted: { label: 'Awaiting customer decision', tone: 'waiting' },
    approved: { label: 'Approved', tone: 'success' },
    rejected: { label: 'Declined', tone: 'danger' },
};
const CUSTOMER_SUBMITTED = { label: 'Awaiting your decision', tone: 'attention' };

function money(amount, currency) {
    if (typeof amount !== 'number') return '—';
    return formatMoney(amount, currency || 'BDT') || `${amount}`;
}

function Line({ label, value, strong }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className={strong ? 'text-body font-bold text-ds-foreground' : 'text-body-sm text-ds-muted-foreground'}>{label}</span>
            <span className={strong ? 'ds-numeric text-heading text-ds-foreground' : 'ds-numeric text-body-sm text-ds-foreground'}>{value}</span>
        </div>
    );
}

const QuoteSummary = ({ quote, audience }) => {
    if (!quote || !quote.status || quote.status === 'not_submitted') return null;
    const { currency } = quote;
    const customerDeciding = audience === 'customer' && quote.status === 'submitted';
    const status = customerDeciding ? CUSTOMER_SUBMITTED : (STATUS[quote.status] || { label: 'Quote', tone: 'neutral' });

    return (
        <div className="space-y-3">
            {/* Status is shown by the section this sits in (and the header
                badge); a second "Repair quote" title and badge here repeated it. */}
            <p className="sr-only">Quote status: {status.label}</p>
            <div className="space-y-2.5 rounded-ds-lg bg-ds-muted p-4 sm:p-5">
                <Line label="Labour" value={money(quote.laborAmount, currency)} />
                <Line label="Parts" value={money(quote.partsAmount, currency)} />
                <Line label="Additional charges" value={money(quote.additionalCharges, currency)} />
                <Separator className="!my-3" />
                <Line label="Total" value={money(quote.totalAmount, currency)} strong />
            </div>

            {quote.notes && (
                <div>
                    <p className="text-body-sm font-semibold text-ds-foreground">Technician's notes</p>
                    <p className="mt-0.5 whitespace-pre-line text-body-sm text-ds-muted-foreground">{quote.notes}</p>
                </div>
            )}

            <p className="text-micro text-ds-muted-foreground">
                {quote.submittedAt ? `Quoted ${formatAbsoluteDateTime(quote.submittedAt)}` : null}
                {quote.decidedAt ? ` · ${quote.status === 'approved' ? 'Approved' : 'Declined'} ${formatAbsoluteDateTime(quote.decidedAt)}` : null}
            </p>
            {quote.status === 'rejected' && quote.decisionReason && (
                <p className="rounded-ds-lg border border-ds-border p-3 text-body-sm text-ds-muted-foreground">
                    <span className="font-semibold text-ds-foreground">Reason given: </span>{quote.decisionReason}
                </p>
            )}
            {customerDeciding && <p className="text-body-sm text-ds-muted-foreground">Nothing is charged until you approve. Payment comes next.</p>}
        </div>
    );
};

export default QuoteSummary;
