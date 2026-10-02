import { formatMoneyRange } from './currency';

// Gentle warnings on a technician's offer, measured against the price guide
// (see getPriceGuide). Advice only - the server's own limits still apply.
// Returns a list of { id, text }.
export function getOfferWarnings(guide, { estimateMin, estimateMax, inspectionFee }) {
    if (!guide) return [];
    const min = Number(estimateMin);
    const max = Number(estimateMax);
    const fee = Number(inspectionFee);
    const usual = formatMoneyRange(guide.estimate.low, guide.estimate.high, guide.currency);
    const warnings = [];
    if (Number.isFinite(min) && min > 0 && guide.estimate.high > 0 && min > guide.estimate.high * 1.3) {
        warnings.push({ id: 'high', text: `Your estimate is well above the usual ${usual}. Customers often reject offers that look high.` });
    }
    if (Number.isFinite(max) && max > 0 && guide.estimate.low > 0 && max < guide.estimate.low * 0.7) {
        warnings.push({ id: 'low', text: `Your estimate is well below the usual ${usual}. Make sure it covers parts and work.` });
    }
    if (min > 0 && max > min * 3) {
        warnings.push({ id: 'wide', text: 'Your range is very wide. A narrower range is easier for the customer to trust.' });
    }
    if (guide.inspectionFee && Number.isFinite(fee) && fee > 0 && fee > guide.inspectionFee.high) {
        warnings.push({ id: 'fee', text: `Your inspection fee is above what most technicians charge (${formatMoneyRange(guide.inspectionFee.low, guide.inspectionFee.high, guide.currency)}).` });
    }
    return warnings;
}
