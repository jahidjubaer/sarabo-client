import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { notify } from '../../lib/notify';
import { formatMoney } from '../../utils/currency';

const SETTLE_ERROR_COPY = {
    TECHNICIAN_EARNING_ALREADY_PAID: 'This earning is already marked as paid.',
    REPAIR_NOT_COMPLETED: 'The repair is not completed yet.',
    REQUEST_NOT_ASSIGNED: 'This repair has no assigned technician.',
    TECHNICIAN_EARNING_UNAVAILABLE: 'No technician earning can be resolved for this repair.',
    ADMIN_REQUIRED: 'Only an admin can record settlement.',
};
function settleErrorMessage(error) {
    return SETTLE_ERROR_COPY[error?.response?.data?.code] || 'Could not mark the earning as paid. Please try again.';
}

// Phase 8.11: admin-only technician-earning settlement. Accounting/settlement
// only - "Mark as paid" records the earning as settled and does NOT initiate any
// external money transfer. Rendered only in the admin workspace for a completed
// repair that carries a technician earning. The amount is server-authoritative
// (labor component of the approved quote); this UI never sends an amount.
const TechnicianEarningSettlement = ({ requestId, earning }) => {
    const [open, setOpen] = useState(false);
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => axiosSecure.post(`/admin/repair-requests/${requestId}/technician-earning/mark-paid`),
        onSuccess: () => {
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ['repair-requests', requestId] });
            notify.success('Technician earning marked as paid.');
        },
        onError: (err) => { setOpen(false); notify.error(settleErrorMessage(err)); },
    });

    if (!earning) return null;
    const isPaid = earning.status === 'paid';

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-ds border border-ds-border p-4">
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-ds-foreground">Technician earning</p>
                    <p className="text-lg font-bold text-ds-foreground">{formatMoney(earning.amount, earning.currency) || '—'}</p>
                    <p className="flex items-center gap-1.5 text-xs text-ds-muted-foreground">
                        Settlement: {isPaid ? <Badge tone="success">Paid</Badge> : <Badge tone="warning">Pending</Badge>}
                    </p>
                </div>
                {!isPaid && (
                    <Button variant="action" size="sm" onClick={() => setOpen(true)} disabled={mutation.isPending}>
                        <Wallet aria-hidden="true" /> Mark as Paid
                    </Button>
                )}
            </div>

            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="Mark technician earning as paid?"
                description="This records the technician earning as settled. It does not initiate an external money transfer."
                confirmLabel="Mark as paid"
                busy={mutation.isPending}
                onConfirm={() => mutation.mutate()}
            />
        </>
    );
};

export default TechnicianEarningSettlement;
