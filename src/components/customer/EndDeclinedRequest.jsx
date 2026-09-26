import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { XCircle } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { closeDeclinedRequest } from '../../api/quotes';
import { formatMoney } from '../../utils/currency';
import { notify } from '../../lib/notify';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../common/ConfirmDialog';

const ERROR_COPY = {
    QUOTE_NOT_REJECTED: 'This request has changed - your technician may have sent a new quote. The page has been refreshed.',
    REQUEST_CHANGED: 'This request changed meanwhile - the page has been refreshed.',
    REQUEST_ALREADY_PAID: 'This repair has already been paid for.',
};

// After declining the final price, the customer can end the request instead
// of waiting for a revised quote (declined-quote follow-through). A paid
// inspection fee is not refunded - it paid for the visit and inspection.
function EndDeclinedRequest({ request }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [confirming, setConfirming] = useState(false);
    const fee = request.inspectionPayment?.status === 'paid' ? request.inspectionPayment : null;

    const end = useMutation({
        mutationFn: () => closeDeclinedRequest(axiosSecure, request._id),
        onSuccess: () => {
            setConfirming(false);
            queryClient.invalidateQueries({ queryKey: ['repair-requests'] });
            notify.success('Request closed. You can request the repair again at any time.');
        },
        onError: (error) => {
            setConfirming(false);
            queryClient.invalidateQueries({ queryKey: ['repair-requests', request._id] });
            notify.error(ERROR_COPY[error?.response?.data?.code] || 'The request could not be closed. Please try again.');
        },
    });

    return (
        <>
            <Button variant="outline" onClick={() => setConfirming(true)} disabled={end.isPending}>
                <XCircle aria-hidden="true" /> End this request
            </Button>
            <ConfirmDialog
                open={confirming}
                onOpenChange={(open) => { if (!open) setConfirming(false); }}
                title="End this request?"
                description={`Your technician won't send a new quote and the request will be closed.${fee
                    ? ` Your ${formatMoney(fee.amount, fee.currency || 'BDT')} inspection fee is not refunded - it paid for the visit and inspection.`
                    : ''} Arrange with your technician to get your device back.`}
                confirmLabel="End request"
                cancelLabel="Keep waiting"
                destructive
                busy={end.isPending}
                busyLabel="Closing…"
                onConfirm={() => end.mutate()}
            />
        </>
    );
}

export { EndDeclinedRequest };
