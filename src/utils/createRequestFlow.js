// Pure presentation/flow helpers for the V2 create-repair-request journey
// (Phase 7.7). This module NEVER fetches, never mutates, and never invents a
// taxonomy or price of its own - it only reads already-fetched, already-
// normalized catalogue definitions (see serviceDefinitionCatalog.js) and the
// customer's own react-hook-form values to drive the live request summary,
// the review recap, and the post-create next actions. The server remains the
// sole authority over pricing and request creation; nothing here changes the
// submitted payload (that is buildRepairRequestV2Payload's frozen contract).

import { findDefinitionById, formatEstimateRange } from './serviceDefinitionCatalog';

function nonBlank(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

// Normalizes a server pricingEstimate into a display-ready inspection-fee
// descriptor. Returns hasFee:false for a missing/zero/non-finite fee so the
// UI can omit the line entirely rather than showing a misleading "৳0".
export function getInspectionFee(definition) {
    const fee = definition?.pricingEstimate?.inspectionFee;
    if (typeof fee === 'number' && Number.isFinite(fee) && fee > 0) {
        return { hasFee: true, amount: fee, currency: definition.pricingEstimate.currency };
    }
    return { hasFee: false, amount: 0, currency: definition?.pricingEstimate?.currency || '' };
}

// Builds the read-only review recap from local form values + the already-
// fetched catalogue. Shows only human-friendly, customer-facing fields (never
// slugs, never every raw form key), and takes the estimate straight from the
// server-owned definition - never a client calculation.
export function buildReviewModel(values, definitions, productCategories) {
    const definition = findDefinitionById(definitions || [], values?.serviceDefinitionId);
    const category = (productCategories || []).find((c) => c.slug === values?.productCategorySlug) || null;
    const location = values?.serviceLocation || {};
    const deviceParts = [values?.productBrand, values?.productModel]
        .map((part) => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean);
    const locationText = [location.address, location.district, location.region]
        .map((part) => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean)
        .join(', ');
    return {
        productCategoryLabel: category?.label || '',
        deviceLabel: deviceParts.join(' ') || null,
        serialNumber: nonBlank(values?.productSerialNumber) ? values.productSerialNumber.trim() : null,
        serviceLabel: definition?.label || '',
        estimateText: definition ? formatEstimateRange(definition.pricingEstimate) : '',
        issue: nonBlank(values?.damageDescription) ? values.damageDescription.trim() : '',
        locationText,
        definition,
    };
}

// Post-create navigation targets - existing routes only, no new destinations.
// createAnother returns to the same canonical create route (the form resets
// its own local state; it never auto-submits a second request).
export function getSuccessActions(requestId) {
    const id = typeof requestId === 'string' && requestId.trim().length > 0 ? requestId.trim() : null;
    return {
        viewRequest: id ? `/dashboard/my-requests/${id}` : '/dashboard/my-requests',
        myRequests: '/dashboard/my-requests',
        createAnother: '/dashboard/create-request',
    };
}
