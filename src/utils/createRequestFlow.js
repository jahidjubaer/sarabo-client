// Pure presentation/flow helpers for the V2 create-repair-request journey
// (Phase 7.7). This module NEVER fetches, never mutates, and never invents a
// taxonomy or price of its own - it only reads already-fetched, already-
// normalized catalogue definitions (see serviceDefinitionCatalog.js) and the
// customer's own react-hook-form values to drive the guided section stepper,
// the review recap, and the post-create next actions. The server remains the
// sole authority over pricing and request creation; nothing here changes the
// submitted payload (that is buildRepairRequestV2Payload's frozen contract).

import { DAMAGE_DESCRIPTION_MIN_LENGTH, DAMAGE_DESCRIPTION_MAX_LENGTH } from './repairRequestV2Form';
import { findDefinitionById, formatEstimateRange } from './serviceDefinitionCatalog';

// The four guided sections of the single-page flow. Damage photos are NOT a
// step here - they only exist after the request is created (optional).
export const FLOW_STEPS = [
    { id: 'device', label: 'Device' },
    { id: 'service', label: 'Service' },
    { id: 'location', label: 'Location' },
    { id: 'review', label: 'Review' },
];

// Concise, product-accurate description of what happens after submission -
// used verbatim in the header helper and the review step. Copy only; promises
// no timing the business does not guarantee.
export const WHAT_HAPPENS_NEXT = [
    'Sarabo reviews your request.',
    'An eligible technician is assigned.',
    'Your device is inspected.',
    'You receive a repair quote.',
    'Repair starts after you approve and pay.',
];

function nonBlank(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

// Device section is "complete enough" to advance once a product category is
// chosen (brand/model/serial are optional and never gate progress).
export function isDeviceStepComplete(values) {
    return nonBlank(values?.productCategorySlug);
}

// Service section needs both a chosen service AND a valid-length problem
// description (which is required, mirroring the server's own bounds).
export function isServiceStepComplete(values) {
    const description = typeof values?.damageDescription === 'string' ? values.damageDescription.trim() : '';
    return (
        nonBlank(values?.serviceDefinitionId)
        && description.length >= DAMAGE_DESCRIPTION_MIN_LENGTH
        && description.length <= DAMAGE_DESCRIPTION_MAX_LENGTH
    );
}

export function isLocationStepComplete(values) {
    const location = values?.serviceLocation || {};
    return nonBlank(location.region) && nonBlank(location.district) && nonBlank(location.address);
}

// Section-completion snapshot for the stepper. Review "unlocks" only when the
// three data sections are individually complete - purely a display cue; the
// server still re-validates everything on submit.
export function deriveFlowProgress(values) {
    const device = isDeviceStepComplete(values);
    const service = isServiceStepComplete(values);
    const location = isLocationStepComplete(values);
    return {
        device,
        service,
        location,
        review: device && service && location,
        completedCount: [device, service, location].filter(Boolean).length,
        totalCount: 3,
    };
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
