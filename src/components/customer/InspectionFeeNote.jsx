import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarX } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { getBookingCancellation, cancelBooking } from '../../api/inspectionFee';
import { canCancelBookedVisit, inspectionFeeSentence } from '../../utils/inspectionFee';
import { formatMoney } from '../../utils/currency';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';
import { notify } from '../../lib/notify';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../common/ConfirmDialog';

const ERROR_COPY = {
    ALREADY_CANCELLED: 'This request is already cancelled.',
    BOOKING_NOT_CANCELLABLE: 'This visit can no longer be cancelled here - the technician may already have your device.',
    REQUEST_CHANGED: 'This request changed meanwhile - the page has been refreshed.',
};

const DONE_COPY = {
    refunded: 'Visit cancelled. Your inspection fee has been refunded.',
    refund_pending: 'Visit cancelled. Your inspection fee refund is on its way.',
    kept: 'Visit cancelled. The inspection fee was not refunded.',
};

// The inspection fee on the customer's request (job-portal phase D): what
// happened to it, and - while the paid visit has not happened yet - a way to
// cancel it. The dialog says beforehand whether the fee comes back (2 hours
// or more before the pickup time) or not; the server decides again on submit.
function InspectionFeeNote({ request }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [confirming, setConfirming] = useState(false);
    const sentence = inspectionFeeSentence(request);
    const cancellable = canCancelBookedVisit(request);

    const preview = useQuery({
        queryKey: ['booking-cancellation', request._id],
        queryFn: () => getBookingCancellation(axiosSecure, request._id),
        enabled: confirming,
        staleTime: 0,
    });

    const cancel = useMutation({
        mutationFn: () => cancelBooking(axiosSecure, request._id),
        onSuccess: (result) => {
            setConfirming(false);
            queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
            notify.success(DONE_COPY[result.inspectionFee] || 'Visit cancelled.');
        },
        onError: (error) => {
            setConfirming(false);
            queryClient.invalidateQueries({ queryKey: ['repair-requests', request._id] });
            notify.error(ERROR_COPY[error?.response?.data?.code] || 'The visit could not be cancelled. Please try again.');
        },
    });

    if (!sentence && !cancellable) return null;

    const info = preview.data;
    const fee = info ? formatMoney(info.fee, info.currency || 'BDT') : null;
    let description = 'Checking what happens to your inspection fee…';
    if (preview.isError) description = 'We could not check the refund rule right now. Please close this and try again.';
    else if (info && !info.cancellable) description = 'This visit can no longer be cancelled here.';
    else if (info && info.outcome === 'refund') {
        description = `The visit is more than 2 hours away, so your ${fee} inspection fee will be refunded in full.${info.refundCutoffAt ? ` (Free cancellation until ${formatAbsoluteDateTime(info.refundCutoffAt)}.)` : ''}`;
    } else if (info && info.outcome === 'kept') {
        description = `The visit starts in less than 2 hours, so your ${fee} inspection fee will not be refunded - it pays the technician for keeping the time for you.`;
    }
    const ready = Boolean(info && info.cancellable);

    return (
        <div className="space-y-3">
            {sentence && <p className="text-body-sm text-ds-muted-foreground">{sentence}</p>}
            {cancellable && (
                <>
                    <Button variant="outline" size="sm" onClick={() => setConfirming(true)} disabled={cancel.isPending}>
                        <CalendarX aria-hidden="true" /> Cancel visit
                    </Button>
                    <ConfirmDialog
                        open={confirming}
                        onOpenChange={(open) => { if (!open) setConfirming(false); }}
                        title="Cancel this visit?"
                        description={description}
                        confirmLabel={ready && info.outcome === 'kept' ? 'Cancel without refund' : 'Cancel visit'}
                        cancelLabel="Keep visit"
                        destructive
                        busy={cancel.isPending}
                        busyLabel="Cancelling…"
                        confirmDisabled={!ready}
                        onConfirm={() => cancel.mutate()}
                    />
                </>
            )}
        </div>
    );
}

export { InspectionFeeNote };
