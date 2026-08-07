// Pure normalization layer over the public GET /service-definitions
// response (Phase 6.4 Unit 3A). Never fetches anything itself. The server
// route always queries { isActive: true } (see sarabo-server's
// controllers/serviceDefinitionController.js#listServiceDefinitions) and its
// serialized shape never even includes an `isActive` field - so "active
// only" is already guaranteed by construction, not re-derived here.
// Product-category slugs and repair-service labels are always taken
// verbatim from the server; this module never invents a taxonomy value of
// its own, it only groups/sorts/formats what the server already sent.

import { formatMoneyRange } from './currency';

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function isWellFormedDefinition(def) {
    if (typeof def !== 'object' || def === null) return false;
    if (!isNonEmptyString(def.id)) return false;
    if (!isNonEmptyString(def.productCategorySlug)) return false;
    if (!isNonEmptyString(def.repairCategorySlug)) return false;
    if (!isNonEmptyString(def.label)) return false;
    const estimate = def.pricingEstimate;
    if (typeof estimate !== 'object' || estimate === null) return false;
    if (!isNonEmptyString(estimate.currency)) return false;
    if (!isFiniteNumber(estimate.min) || !isFiniteNumber(estimate.max)) return false;
    return true;
}

// Drops any malformed row rather than throwing - one bad row from the API
// must never take down the whole catalogue for every customer.
export function normalizeServiceDefinitions(rawResponse) {
    const list = Array.isArray(rawResponse?.serviceDefinitions) ? rawResponse.serviceDefinitions : [];
    return list.filter(isWellFormedDefinition);
}

// "air-conditioner" -> "Air Conditioner". A pure display transform of the
// server's own slug, never a hardcoded label table - so it can never drift
// out of sync with the server's canonical (but not publicly exposed)
// product-category catalog.
export function humanizeSlug(slug) {
    return slug
        .split('-')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Deterministic (alphabetical by slug) - the server response has no
// inherent ordering (see models/ServiceDefinition.js#findMany, no .sort()).
export function deriveProductCategories(definitions) {
    const slugs = [...new Set(definitions.map((def) => def.productCategorySlug))].sort();
    return slugs.map((slug) => ({ slug, label: humanizeSlug(slug) }));
}

// Deterministic (alphabetical by label) for the repair-service dropdown
// within a selected product category.
export function getServicesForProduct(definitions, productCategorySlug) {
    return definitions
        .filter((def) => def.productCategorySlug === productCategorySlug)
        .sort((a, b) => a.label.localeCompare(b.label));
}

export function findDefinitionById(definitions, id) {
    return definitions.find((def) => def.id === id) || null;
}

// Display-only formatting of the server-provided estimate range - never a
// calculation and never a currency conversion. Delegates to the shared
// currency formatter (src/utils/currency.js), which renders the range in
// whatever currency the API returned: the canonical catalogue is now BDT
// ("৳500 – ৳800"), while any legacy USD definition still renders as dollars.
export function formatEstimateRange(pricingEstimate) {
    if (!pricingEstimate) return '';
    const { currency, min, max } = pricingEstimate;
    return formatMoneyRange(min, max, currency);
}
