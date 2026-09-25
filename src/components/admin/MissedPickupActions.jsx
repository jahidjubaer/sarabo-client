import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, UserCog } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { adminAttentionKeys } from '../../hooks/useAdminAttention';
import { withdrawMissedPickup, askForNewPickupTime } from '../../api/missedPickups';
import { formatPickupSlot } from '../../utils/pickupSlots';
import { notify } from '../../lib/notify';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../common/ConfirmDialog';

const ERROR_COPY = {
    PICKUP_NOT_MISSED: 'This pickup is no longer missed - the page has been refreshed.',
    REQUEST_CHANGED: 'This request changed meanwhile - the page has been refreshed.',
    NEW_TIME_ALREADY_REQUESTED: 'The customer has already been asked for a new time.',
    OWNER_NOT_FOUND: "The customer's account could not be found.",
};

const errorMessage = (error, fallback) => ERROR_COPY[error?.response?.data?.code] || fallback;

// The two ways out of a missed pickup (missed-pickup phase): give the job to
// someone else, or keep the technician and ask the customer for a new time.
// Each asks for confirmation; the server re-checks that the pickup is missed.
function MissedPickupActions({ request }) {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [confirming, setConfirming] = useState(null); // 'withdraw' | 'ask' | null

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['repair-requests', request._id] });
        queryClient.invalidateQueries({ queryKey: adminAttentionKeys.all });
        queryClient.invalidateQueries({ queryKey: ['requests', 'pending-assignment'] });
        queryClient.invalidateQueries({ queryKey: ['admin-all-requests'] });
    };

    const withdraw = useMutation({
        mutationFn: () => withdrawMissedPickup(axiosSecure, request._id),
        onSuccess: (result) => {
            refresh();
            setConfirming(null);
            const refund = result?.inspectionFee === 'refunded' ? ' The inspection fee was refunded to the customer.'
                : result?.inspectionFee === 'refund_pending' ? ' The inspection fee refund is waiting - retry it from the request page.' : '';
            notify.success(`${request.technicianName || 'The technician'} is off this job. Choose who to offer it to next.${refund}`);
            navigate(`/dashboard/assign-technicians?request=${request._id}`);
        },
        onError: (error) => {
            setConfirming(null);
            refresh();
            notify.error(errorMessage(error, 'The job could not be taken back. Please try again.'));
        },
    });

    const ask = useMutation({
        mutationFn: () => askForNewPickupTime(axiosSecure, request._id),
        onSuccess: () => {
            refresh();
            setConfirming(null);
            notify.success('The customer has been asked to choose a new pickup time.');
        },
        onError: (error) => {
            setConfirming(null);
            refresh();
            notify.error(errorMessage(error, 'The customer could not be asked. Please try again.'));
        },
    });

    const busy = withdraw.isPending || ask.isPending;
    const technician = request.technicianName || 'the technician';
    const slot = formatPickupSlot(request.pickupSlot);
    // A no-show: a paid inspection fee goes back to the customer (phase D).
    const feePaid = request.inspectionPayment?.status === 'paid';

    return (
        <>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button variant="action" onClick={() => setConfirming('withdraw')} disabled={busy}>
                    <UserCog aria-hidden="true" /> Offer to another technician
                </Button>
                <Button variant="outline" onClick={() => setConfirming('ask')} disabled={busy}>
                    <CalendarClock aria-hidden="true" /> Ask customer for a new time
                </Button>
            </div>
            <ConfirmDialog
                open={confirming === 'withdraw'}
                onOpenChange={(open) => { if (!open) setConfirming(null); }}
                title="Offer this job to another technician?"
                description={`${technician} will be taken off this job and told why, and becomes free for other work. The request goes back to waiting, and you choose who to offer it to next.${feePaid ? " The customer's inspection fee is refunded in full, and the other technicians who applied can be chosen again." : ''}`}
                confirmLabel="Take job back"
                busy={withdraw.isPending}
                busyLabel="Taking it back…"
                onConfirm={() => withdraw.mutate()}
            />
            <ConfirmDialog
                open={confirming === 'ask'}
                onOpenChange={(open) => { if (!open) setConfirming(null); }}
                title="Ask the customer for a new pickup time?"
                description={`${technician} stays on the job. The customer is notified that the pickup${slot ? ` (${slot})` : ''} was missed and asked to choose a new time.`}
                confirmLabel="Ask customer"
                busy={ask.isPending}
                busyLabel="Asking…"
                onConfirm={() => ask.mutate()}
            />
        </>
    );
}

export { MissedPickupActions };
