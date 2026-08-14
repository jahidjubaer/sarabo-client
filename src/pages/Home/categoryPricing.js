import { formatMoneyRange } from '../../utils/currency';

// Per-category estimate ranges for the homepage price list.
//
// The catalogue stores a real `pricingEstimate { currency, min, max }` on every
// SERVICE definition, not on a category. This spans a category's own services -
// the lowest minimum to the highest maximum - so the figure shown is always
// bounded by numbers the server actually stated. Nothing is invented, rounded
// or marked up.
//
// It is still a DERIVED number, so the UI labels it as an estimated range and
// says the real price comes from the quote after inspection.
//
// Fails safe rather than guessing:
//   - a category whose definitions mix currencies returns null (no meaningful
//     single span exists, and converting would invent an exchange rate)
//   - a category with no well-formed estimate returns null
// A null simply means that row shows no range.
export function getCategoryEstimateRanges(definitions) {
    const byCategory = new Map();

    for (const def of definitions) {
        const estimate = def?.pricingEstimate;
        if (!estimate) continue;

        const slug = def.productCategorySlug;
        const existing = byCategory.get(slug);

        if (!existing) {
            byCategory.set(slug, { currency: estimate.currency, min: estimate.min, max: estimate.max, mixed: false });
            continue;
        }
        if (existing.mixed) continue;
        if (existing.currency !== estimate.currency) {
            existing.mixed = true;
            continue;
        }
        existing.min = Math.min(existing.min, estimate.min);
        existing.max = Math.max(existing.max, estimate.max);
    }

    const ranges = {};
    for (const [slug, value] of byCategory) {
        ranges[slug] = value.mixed ? null : (formatMoneyRange(value.min, value.max, value.currency) || null);
    }
    return ranges;
}
