import { ReceiptText } from 'lucide-react';
import { formatEstimateRange } from '../../utils/serviceDefinitionCatalog';
import { getInspectionFee } from '../../utils/createRequestFlow';
import { formatMoney } from '../../utils/currency';

// The estimate for the chosen service, shown directly under the service
// picker. Every figure is the server-owned definition.pricingEstimate - never
// calculated, summed or converted, and never labelled a final price. The
// "estimate only" note appears here once; nowhere else on the form repeats it.
// No live region: the range sits next to the control that changed it.
const EstimateCard = ({ definition, className }) => {
    if (!definition?.pricingEstimate) return null;
    const rangeText = formatEstimateRange(definition.pricingEstimate);
    const inspection = getInspectionFee(definition);

    return (
        <div className={`flex items-start gap-3 rounded-ds-lg bg-ds-accent p-4 ${className || ''}`}>
            <ReceiptText aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ds-accent-foreground" />
            <div className="min-w-0 space-y-1">
                <p className="text-body-sm text-ds-accent-foreground">
                    Estimated <span className="ds-numeric font-bold">{rangeText || 'not available'}</span>
                    {inspection.hasFee && <> · inspection fee <span className="ds-numeric font-bold">{formatMoney(inspection.amount, inspection.currency)}</span></>}
                </p>
                <p className="text-micro text-ds-accent-foreground/80">
                    An estimate only. Your technician confirms the price in a quote after inspection, and nothing is charged now.
                </p>
            </div>
        </div>
    );
};

export default EstimateCard;
