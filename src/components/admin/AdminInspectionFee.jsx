import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { retryInspectionFeeRefund } from '../../api/inspectionFee';
import { formatMoney } from '../../utils/currency';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { notify } from '../../lib/notify';
import { LoadingButton } from '../common/LoadingButton';

const STATUS_COPY = {
    paid: 'Paid - counts toward the final price',
    refund_pending: 'Refund waiting - Stripe has not completed it yet',
    refunded: 'Refunded to the customer',
    kept: 'Kept - split between the technician and Sarabo',
};

const REASON_COPY = {
    booking_failed: 'the technician could not be booked after payment',
    technician_no_show: 'the technician did not come for the pickup',
    customer_cancelled: 'the customer cancelled 2 hours or more before the visit',
    quote_declined: 'the customer declined the final price',
    late_cancellation: 'the customer cancelled less than 2 hours before the visit',
};

// The inspection fee on a request, for admins (job-portal phase D): what
// happened to it and why, the 90/10 split of a kept fee, and a retry for a
// refund Stripe did not complete.
function AdminInspectionFee({ request }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const payment = request.inspectionPayment;
    const settlement = request.inspectionFeeSettlement;

    const retry = useMutation({
        mutationFn: () => retryInspectionFeeRefund(axiosSecure, request._id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repair-requests', request._id] });
            notify.success('The inspection fee has been refunded.');
        },
        onError: (error) => {
            queryClient.invalidateQueries({ queryKey: ['repair-requests', request._id] });
            const code = error?.response?.data?.code;
            notify.error(code === 'NO_REFUND_PENDING'
                ? 'There is no refund waiting on this request any more.'
                : 'Stripe did not complete the refund. Try again later.');
        },
    });

    if (!payment) return null;
    const currency = payment.currency || 'BDT';
    const reason = REASON_COPY[payment.refundReason || payment.keptReason];

    return (
        <div className="space-y-3 text-body-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                <dt className="text-ds-muted-foreground">Fee</dt>
                <dd className="ds-numeric font-semibold text-ds-foreground">{formatMoney(payment.amount, currency)}</dd>
                <dt className="text-ds-muted-foreground">State</dt>
                <dd className="text-ds-foreground">{STATUS_COPY[payment.status] || payment.status}</dd>
                {reason && (
                    <>
                        <dt className="text-ds-muted-foreground">Why</dt>
                        <dd className="text-ds-foreground">Because {reason}.</dd>
                    </>
                )}
                {payment.paidAt && (
                    <>
                        <dt className="text-ds-muted-foreground">Paid</dt>
                        <dd className="text-ds-foreground">{formatAbsoluteDateTime(payment.paidAt)}</dd>
                    </>
                )}
                {payment.refundedAt && (
                    <>
                        <dt className="text-ds-muted-foreground">Refunded</dt>
                        <dd className="text-ds-foreground">{formatAbsoluteDateTime(payment.refundedAt)}</dd>
                    </>
                )}
                {settlement && (
                    <>
                        <dt className="text-ds-muted-foreground">Technician</dt>
                        <dd className="ds-numeric text-ds-foreground">{formatMoney(settlement.technicianReceivable, currency)} to their wallet</dd>
                        <dt className="text-ds-muted-foreground">Sarabo</dt>
                        <dd className="ds-numeric text-ds-foreground">{formatMoney(settlement.platformCommission, currency)} ({Math.round((settlement.commissionRate || 0.1) * 100)}%)</dd>
                    </>
                )}
            </dl>
            {payment.status === 'refund_pending' && (
                <LoadingButton variant="action" onClick={() => retry.mutate()} loading={retry.isPending} loadingText="Refunding…">
                    <RefreshCw aria-hidden="true" /> Retry refund
                </LoadingButton>
            )}
        </div>
    );
}

export { AdminInspectionFee };
