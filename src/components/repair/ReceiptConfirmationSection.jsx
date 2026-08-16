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

    // Only meaningful after the repair itself is completed.
    if (request?.deliveryStatus !== 'repair_completed') return null;

    const confirmation = request.customerReceiptConfirmation || { status: 'pending', confirmedAt: null };
    const isConfirmed = confirmation.status === 'confirmed';

    const onConfirm = () => {
        mutation.mutate(undefined, {
            onSuccess: () => { setOpen(false); notify.success('Thanks! We’ve recorded that you received your device.'); },
            onError: (err) => { setOpen(false); notify.error(confirmErrorMessage(err)); },
        });
    };

    if (isConfirmed) {
        return (
            <div className="flex items-start gap-3 rounded-ds border border-ds-border bg-ds-muted/30 p-4">
                <CircleCheckBig aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-success" />
                <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-ds-foreground">Device received</p>
                    {confirmation.confirmedAt && (
                        <p className="text-xs text-ds-muted-foreground">Confirmed on {formatAbsoluteDateTime(confirmation.confirmedAt)}</p>
                    )}
                </div>
            </div>
        );
    }

    // Pending, non-owner (admin / assigned technician): read-only status, no action.
    if (!isOwner) {
        return (
            <div className="flex items-center gap-2 rounded-ds border border-ds-border bg-ds-muted/20 p-4">
                <PackageCheck aria-hidden="true" className="size-5 shrink-0 text-ds-muted-foreground" />
                <p className="text-sm text-ds-muted-foreground">Pending customer confirmation of receipt.</p>
            </div>
        );
    }

    // Pending, owner: the confirmation action.
    return (
        <>
            <div className="space-y-3 rounded-ds border border-ds-border p-4">
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-ds-foreground">Have you received your repaired device?</p>
                    <p className="text-xs text-ds-muted-foreground">Confirm once you have received your repaired device.</p>
                </div>
                <Button variant="action" size="sm" onClick={() => setOpen(true)} disabled={busy}>
                    <PackageCheck aria-hidden="true" /> Confirm Device Received
                </Button>
            </div>

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
