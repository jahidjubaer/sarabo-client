import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Hash, Receipt } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { PageHeader } from '../../../components/common/PageHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { CardSkeleton } from '../../../components/common/Skeletons';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { formatMoney } from '../../../utils/currency';
import { formatAbsoluteDateTime } from '../../../utils/relativeTime';

// Payment History (Phase 12). A supporting account surface: it records what was
// already paid, so it stays quiet - no marigold, no totals, no trends. Every
// value shown is a field the server actually persists on a payment document
// (see sarabo-server's services/paymentProcessor.js): paymentStatus, amount +
// its own stored currency, trackingId, paidAt, transactionId, customerEmail.
// Nothing is summed, averaged, projected or converted here.
//
// A raw status string is never shown. Only statuses this map knows are
// rendered as a badge; an unknown/absent one simply shows no badge rather than
// leaking an internal value or inventing a label.
const PAYMENT_STATUS_PRESENTATION = {
    paid: { label: 'Paid', tone: 'success' },
};

function DetailRow({ icon: Icon, label, children }) {
    return (
        <div className="flex min-w-0 items-start gap-2">
            {Icon ? <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-ds-muted-foreground" /> : null}
            <div className="min-w-0">
                <dt className="text-micro text-ds-muted-foreground">{label}</dt>
                <dd className="mt-0.5 min-w-0 break-all text-body-sm text-ds-foreground">{children}</dd>
            </div>
        </div>
    );
}

function PaymentRecord({ payment }) {
    const status = PAYMENT_STATUS_PRESENTATION[payment.paymentStatus];
    // formatMoney returns '' for a non-finite amount and never converts between
    // currencies - each record formats in its OWN persisted currency (canonical
    // V2 = BDT, legacy V1 = USD).
    const amount = formatMoney(payment.amount, payment.currency);
    const paidAt = formatAbsoluteDateTime(payment.paidAt);

    return (
        <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                {status
                    ? <Badge tone={status.tone}>{status.label}</Badge>
                    : <span className="text-body-sm text-ds-muted-foreground">Payment record</span>}
                <p className="ds-numeric min-w-0 break-all text-heading text-ds-foreground">{amount || '—'}</p>
            </div>

            <dl className="mt-4 grid gap-3 border-t border-ds-border pt-4 sm:grid-cols-2">
                <DetailRow icon={Hash} label="Repair tracking ID">
                    <span className="ds-numeric">{payment.trackingId || '—'}</span>
                </DetailRow>
                <DetailRow icon={CalendarDays} label="Paid">
                    {paidAt || '—'}
                </DetailRow>
                <DetailRow icon={Receipt} label="Transaction ID">
                    <span className="ds-numeric">{payment.transactionId || '—'}</span>
                </DetailRow>
                <DetailRow label="Account">
                    {payment.customerEmail || '—'}
                </DetailRow>
            </dl>
        </Card>
    );
}

const PaymentHistory = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const paymentsQueryKey = ['payments', user.email];

    const paymentsQuery = useQuery({
        queryKey: paymentsQueryKey,
        queryFn: async () => {
            // No email in the request URL - the server already scopes a
            // non-admin caller to their own token-derived identity.
            const res = await axiosSecure.get('/payments')
            return res.data;
        }
    })

    const hasUsablePayments = Array.isArray(paymentsQuery.data);
    const payments = hasUsablePayments ? paymentsQuery.data : [];
    const isInitialLoading = paymentsQuery.isPending && !paymentsQuery.isPaused && !hasUsablePayments;
    const isUnavailableBeforeData = paymentsQuery.isPaused && !hasUsablePayments;
    const isErrorBeforeData = paymentsQuery.isError && !hasUsablePayments;
    const retryPayments = () => queryClient.resetQueries({ queryKey: paymentsQueryKey });

    // The heading is rendered in every branch so the route always has exactly
    // one h1 (PageHeader owns it) - loading and error states included.
    const header = (
        <PageHeader
            eyebrow="Account"
            title="Payment History"
            description={
                hasUsablePayments
                    ? (payments.length === 0
                        ? 'Payments for your repair requests are recorded here.'
                        : `${payments.length} payment record${payments.length === 1 ? '' : 's'}, newest first.`)
                    : 'Payments for your repair requests are recorded here.'
            }
        />
    );

    if (isInitialLoading) {
        return (
            <div className="space-y-6">
                {header}
                <div className="grid gap-3">
                    {[0, 1, 2].map((key) => <CardSkeleton key={key} className="h-32" />)}
                </div>
            </div>
        );
    }

    if (isUnavailableBeforeData || isErrorBeforeData) {
        return (
            <div className="space-y-6">
                {header}
                <ErrorState
                    title="Couldn't load payment history"
                    description="Your payment history is unavailable right now. Please try again."
                    onRetry={retryPayments}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {header}

            {payments.length === 0 ? (
                <EmptyState
                    icon={Receipt}
                    title="No payments yet"
                    description="Once you complete a payment for a repair request, its record appears here."
                />
            ) : (
                // Server order is preserved exactly (newest first, sorted by
                // paidAt on the server) - never re-sorted on the client.
                <ul className="grid gap-3">
                    {payments.map((payment) => (
                        <li key={payment._id}>
                            <PaymentRecord payment={payment} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PaymentHistory;
