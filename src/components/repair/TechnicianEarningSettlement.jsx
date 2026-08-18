import { Badge } from '../ui/badge';
import { formatMoney } from '../../utils/currency';

// HISTORICAL RECORD ONLY (Phase 9). This used to carry an admin "Mark as Paid"
// button posting to /admin/repair-requests/:id/technician-earning/mark-paid.
// That endpoint is retired: technician money now runs through the wallet - 90%
// of the customer-approved subtotal is snapshotted at payment, released by the
// customer's receipt confirmation, and paid out from the admin withdrawal
// queue. Leaving the old control alive beside that would be a second,
// independent way to pay a technician for the same repair.
//
// The panel stays because the earnings it describes really happened. Repairs
// completed before Phase 9 carry a `technicianEarning` and nothing else, and
// deleting the display would erase the only record of what was paid on them.
// It renders nothing for repairs that have no legacy earning, so new work never
// sees it.
const TechnicianEarningSettlement = ({ earning }) => {
    if (!earning) return null;
    const isPaid = earning.status === 'paid';

    return (
        <div className="space-y-2 rounded-ds border border-ds-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-ds-foreground">Technician earning (legacy)</p>
                    <p className="ds-numeric text-lg font-bold text-ds-foreground">{formatMoney(earning.amount, earning.currency) || '—'}</p>
                </div>
                {isPaid ? <Badge tone="success">Paid</Badge> : <Badge tone="neutral">Not settled</Badge>}
            </div>
            <p className="text-xs text-ds-muted-foreground">
                Recorded under the earlier per-repair payout model. Technician payouts are now
                settled from the wallet withdrawal queue, so this record is read-only.
            </p>
        </div>
    );
};

export default TechnicianEarningSettlement;
