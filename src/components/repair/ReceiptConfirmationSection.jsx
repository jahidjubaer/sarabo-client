import { useState } from 'react';
import { PackageCheck, CircleCheckBig } from 'lucide-react';
import { useConfirmReceipt } from '../../hooks/useRepairMutations';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Button } from '../ui/button';
import { notify } from '../../lib/notify';
import { formatAbsoluteDateTime } from '../../utils/relativeTime';

const CONFIRM_ERROR_COPY = {
    REPAIR_NOT_COMPLETED: 'This repair is not completed yet.',
    ALREADY_CONFIRMED: 'You have already confirmed receipt.',
    REQUEST_NOT_FOUND: 'This request could not be found.',
};
function confirmErrorMessage(error) {
    return CONFIRM_ERROR_COPY[error?.response?.data?.code] || 'Could not confirm receipt. Please try again.';
}

// Phase 8.9: post-completion customer device-receipt confirmation. Rendered
// only once the repair is completed. The owner sees an action (or, once done,
// the confirmed state); admin and the assigned technician see a read-only
// status. Handover vocabulary only - never parcel/rider/courier. The server
// (POST /repair-requests/:id/confirm-receipt) re-authorizes every confirmation.
const ReceiptConfirmationSection = ({ requestId, request, isOwner }) => {
    const [open, setOpen] = useState(false);
    const mutation = useConfirmReceipt(requestId);
    const busy = mutation.isPending;

    const confirmation = request.customerReceiptConfirmation || { status: 'pending', confirmedAt: null };
    const isConfirmed = confirmation.status === 'confirmed';
    const isAwaitingConfirmation = request?.deliveryStatus === 'repair_completed';
    const isConfirmedHandover = request?.deliveryStatus === 'parcel_delivered' && isConfirmed;

    // Meaningful while awaiting confirmation and after the confirmed terminal
    // handover. Legacy parcel_delivered records have no confirmation object and
    // continue rendering no V2 receipt state.
    if (!isAwaitingConfirmation && !isConfirmedHandover) return null;

    const onConfirm = () => {
        mutation.mutate(undefined, {
            onSuccess: () => { setOpen(false); notify.success('Thanks! We’ve recorded that you received your device.'); },
            onError: (err) => { setOpen(false); notify.error(confirmErrorMessage(err)); },
        });
    };

    if (isConfirmed) {
        return (
            <div className="flex items-start gap-3">
                <CircleCheckBig aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-success" />
                <div className="space-y-0.5">
                    <p className="text-body-sm font-semibold text-ds-foreground">Device received</p>
                    {confirmation.confirmedAt && (
                        <p className="text-micro text-ds-muted-foreground">Confirmed {formatAbsoluteDateTime(confirmation.confirmedAt)}</p>
                    )}
                </div>
            </div>
        );
    }

    // Pending, non-owner (admin / assigned technician): read-only status, no action.
    if (!isOwner) {
        return (
            <div className="flex items-center gap-2">
                <PackageCheck aria-hidden="true" className="size-5 shrink-0 text-ds-muted-foreground" />
                <p className="text-body-sm text-ds-muted-foreground">Waiting for the customer to confirm they have the device.</p>
            </div>
        );
    }

    // Pending, owner: the confirmation action.
    return (
        <>
            <Button variant="action" size="lg" onClick={() => setOpen(true)} disabled={busy}>
                <PackageCheck aria-hidden="true" /> Confirm device received
            </Button>

            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="Have you received your repaired device?"
                description="Confirm once your repaired device is back in your hands. This records the handover on your account."
                confirmLabel="Yes, confirm receipt"
                busy={busy}
                onConfirm={onConfirm}
            />
        </>
    );
};

export default ReceiptConfirmationSection;
