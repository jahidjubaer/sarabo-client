import { ReceiptText, Info } from 'lucide-react';
import { formatEstimateRange } from '../../utils/serviceDefinitionCatalog';
import { getInspectionFee } from '../../utils/createRequestFlow';
import { formatMoney } from '../../utils/currency';

// Compact, restrained estimate summary (Phase 7.7). Every figure comes
// straight from the server-owned definition.pricingEstimate - this component
// never calculates, sums, or converts a price, and never labels the range a
// final quote. The canonical V2 catalogue is BDT; whatever currency the
// server stored is what renders (formatMoney/formatEstimateRange), never USD
// for a BDT record and never an FX conversion.
const EstimateCard = ({ definition, className }) => {
    if (!definition?.pricingEstimate) return null;
    const rangeText = formatEstimateRange(definition.pricingEstimate);
    const inspection = getInspectionFee(definition);

    return (
        <div
            className={`rounded-ds-lg border border-ds-border bg-ds-muted/40 p-4 ${className || ''}`}
            aria-live="polite"
        >
            <div className="flex items-start gap-2">
                <ReceiptText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ds-muted-foreground" />
                <div className="min-w-0 space-y-2 text-sm">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-ds-muted-foreground">Estimated repair range</p>
                        <p className="text-base font-semibold text-ds-foreground">{rangeText || 'Not available'}</p>
                    </div>
                    {inspection.hasFee && (
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-ds-muted-foreground">Inspection fee</p>
                            <p className="font-medium text-ds-foreground">{formatMoney(inspection.amount, inspection.currency)}</p>
                        </div>
                    )}
                    <p className="flex items-start gap-1.5 text-xs text-ds-muted-foreground">
                        <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                        <span>This is an estimate only. The final price is confirmed after a technician inspection - no payment is requested now.</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EstimateCard;
