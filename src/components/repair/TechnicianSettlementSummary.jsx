import { Badge } from '../ui/badge';
import { formatMoney } from '../../utils/currency';
import { cn } from '../../lib/utils';

const STATE_PRESENTATION = {
    pending: {
        label: 'Pending',
        tone: 'info',
        description: 'Paid by the Customer. Available after receipt confirmation.',
    },
    available: {
        label: 'Available',
        tone: 'success',
        description: 'Included in your available Wallet balance.',
    },
};

// Current wallet settlement snapshot. Every amount and the commission rate
// comes from the server; this component only formats the persisted values.
function TechnicianSettlementSummary({ settlement, compact = false }) {
    if (!settlement) {
        return (
            <p className="text-sm text-ds-muted-foreground">
                No Wallet settlement was recorded for this earlier repair.
            </p>
        );
    }

    const state = STATE_PRESENTATION[settlement.status] || {
        label: 'Recorded',
        tone: 'neutral',
        description: 'See Wallet for the current accounting state.',
    };
    const commissionPercent = Number.isFinite(Number(settlement.commissionRate))
        ? `${Number(settlement.commissionRate) * 100}%`
        : null;

    return (
        <div className={cn(compact ? 'border-t border-ds-border pt-4' : 'rounded-ds border border-ds-border p-4')}>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div>
                    <dt className="text-xs text-ds-muted-foreground">Repair subtotal</dt>
                    <dd className="ds-numeric mt-0.5 font-semibold text-ds-foreground">
                        {formatMoney(settlement.repairSubtotal, settlement.currency) || '—'}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-ds-muted-foreground">
                        Sarabo commission{commissionPercent ? ` (${commissionPercent})` : ''}
                    </dt>
                    <dd className="ds-numeric mt-0.5 font-medium text-ds-foreground">
                        {formatMoney(settlement.platformCommission, settlement.currency) || '—'}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-ds-muted-foreground">Your receivable</dt>
                    <dd className="ds-numeric mt-0.5 font-semibold text-ds-foreground">
                        {formatMoney(settlement.technicianReceivable, settlement.currency) || '—'}
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-ds-muted-foreground">Settlement state</dt>
                    <dd className="mt-1"><Badge tone={state.tone}>{state.label}</Badge></dd>
                </div>
            </dl>
            <p className="mt-3 text-xs text-ds-muted-foreground">{state.description}</p>
        </div>
    );
}

export default TechnicianSettlementSummary;
