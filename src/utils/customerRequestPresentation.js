import { humanizeSlug } from './serviceDefinitionCatalog';
import { formatMoney } from './currency';
import { getHandoverState } from './repairStage';

// Customer-facing, PRESENTATION-ONLY helpers for the redesigned dashboard +
// My Requests (Phase 7.3). Everything here is derived from data the list API
// already returns (GET /repair-requests) - no new endpoints, no per-request eligibility
// fetches, no changes to any record. Backend statuses are grouped for a
// friendlier customer view; the underlying values are never modified.

// Maps each backend deliveryStatus to a customer-friendly group. A pending
// post-repair handover is layered on through the shared handover utility below;
// it remains separate from the four-stage repair spine. All other in-flight
// states are "active"; terminal completions are "completed"; cancelled is
// "closed". A declined quote is "active", not closed: the technician can still
// send a revised quote (or close the request, which moves it to cancelled).
const STATUS_GROUP = {
    'pending-pickup': 'active',
    'driver_assigned': 'active',
    'rider_arriving': 'active',
    'parcel_picked_up': 'active',
    'inspection_completed': 'active',
    'quote_submitted': 'needs-action',
    'quote_approved': 'needs-action',
    'payment_completed': 'active',
    'repair_in_progress': 'active',
    'repair_completed': 'completed',
    'parcel_delivered': 'completed',
    'quote_rejected': 'active',
    'cancelled': 'closed',
};

export const REQUEST_GROUPS = ['all', 'needs-action', 'active', 'completed', 'closed'];
export const GROUP_LABELS = { all: 'All', 'needs-action': 'Needs you', active: 'In progress', completed: 'Completed', closed: 'Cancelled' };
export const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'status', label: 'Needs you first' },
];

export function getRequestStatus(request) {
    return request?.deliveryStatus || 'pending-pickup';
}

export function getRequestGroup(request) {
    const handover = getHandoverState(request);
    if (handover && !handover.confirmed) return 'needs-action';
    return STATUS_GROUP[getRequestStatus(request)] || 'active';
}

// Whether a Pay control may be OFFERED for a request in a list context.
//
// This deliberately mirrors the server's own rule (sarabo-server's
// services/paymentEligibility.js#getV2PaymentEligibility) rather than
// introducing a second notion of payability: paid wins over everything, and
// only an approved quote on a quote_approved request can be charged. The
// request detail page still asks the server outright via
// GET /repair-requests/:id/payment-eligibility - that endpoint remains the
// authority, and this is only the list-level guess about whether to show a
// button at all.
//
// The previous rule here was `!isPaid && !isCancelled`, which offered "Pay" on
// requests that had no quote yet, on declined quotes, and - because it read
// only paymentStatus - on repairs whose payment had succeeded but whose
// paymentStatus had not been the field consulted. Anything not explicitly
// payable is now not offered.
export function canOfferPayment(request) {
    if (!request) return false;
    if (request.isPaid === true) return false;
    if (request.paymentStatus === 'paid') return false;
    if (request.payment && request.payment.status === 'completed') return false;

    const status = getRequestStatus(request);
    if (status === 'cancelled' || status === 'quote_rejected') return false;
    // Past the payment stage means it was already paid for.
    if (['payment_completed', 'repair_in_progress', 'repair_completed', 'parcel_delivered'].includes(status)) return false;

    const quote = request.quote;
    if (!quote || quote.status !== 'approved') return false;
    return status === 'quote_approved';
}

// True once payment has succeeded, by any of the authoritative markers the
// server may have set. Used to show the paid presentation in place of a Pay
// control.
export function isRequestPaid(request) {
    if (!request) return false;
    if (typeof request.isPaid === 'boolean') return request.isPaid;
    if (request.paymentStatus === 'paid') return true;
    if (request.payment && request.payment.status === 'completed') return true;
    return ['payment_completed', 'repair_in_progress', 'repair_completed', 'parcel_delivered'].includes(getRequestStatus(request));
}

// Customer next-action derived only from existing request presentation state
// (never a per-request payment-eligibility fetch). Every destination is the
// request detail page, where the authoritative quote/payment/handover UI lives.
export function getRequestAction(request) {
    const status = getRequestStatus(request);
    if (!request?._id) return null;
    const to = `/dashboard/my-requests/${request._id}`;
    const handover = getHandoverState(request);
    if (handover && !handover.confirmed) return { kind: 'handover', label: 'Confirm device received', to };
    // An admin asked for a new pickup time after a missed pickup.
    if (request.pickupRescheduleRequestedAt && ['assignment_pending', 'driver_assigned', 'rider_arriving'].includes(status)) {
        return { kind: 'new-pickup-time', label: 'Choose a new pickup time', to };
    }
    if (status === 'quote_submitted') return { kind: 'quote-review', label: 'Review quote', to };
    if (status === 'quote_approved') return { kind: 'payment', label: 'Complete payment', to };
    return null;
}

// Safe device/product identity from list-available fields only.
//
// `device` is the title. v2 requests have no legacy `deviceName`, so the title
// is the brand/model the customer entered, then the category, and only then
// the generic fallback (previously every v2 request was titled "Repair
// request"). Whichever field became the title is blanked in the returned
// `category`/`brandModel`, so callers that show "category · brandModel" under
// the title never repeat it.
export function getProductSummary(request) {
    const legacy = (request?.deviceName || '').trim();
    const category = request?.product?.categorySlug ? humanizeSlug(request.product.categorySlug) : '';
    const brandModel = [request?.product?.brand, request?.product?.model].filter(Boolean).join(' ').trim();
    const device = legacy || brandModel || category || 'Repair request';
    return {
        device,
        category: category === device ? '' : category,
        brandModel: brandModel === device ? '' : brandModel,
    };
}

// One device label for compact surfaces (admin tables, assignment lists) that
// have room for a single line rather than the three fields getProductSummary
// returns.
//
// `deviceName` is the LEGACY (v1) field and is absent on every v2 request, so
// reading it alone renders blank for essentially all current data - that is
// exactly the bug this exists to stop repeating. Preference order is most
// specific first: the v2 brand/model the customer actually entered, then the
// product category, then the legacy name, and only then a truthful fallback.
export function getDeviceLabel(request) {
    const brandModel = [request?.product?.brand, request?.product?.model].filter(Boolean).join(' ').trim();
    if (brandModel) return brandModel;
    if (request?.product?.categorySlug) return humanizeSlug(request.product.categorySlug);
    const legacy = (request?.deviceName || '').trim();
    if (legacy) return legacy;
    return 'Device not specified';
}

// Only an AUTHORITATIVE agreed price is returned - an approved quote's total in
// its own stored currency (via the shared formatMoney, no FX). Estimates and
// legacy costs are intentionally not surfaced here to avoid mixing/implying a
// final price. Returns a formatted string or null.
export function getAgreedPrice(request) {
    const quote = request?.quote;
    if (quote && quote.status === 'approved' && Number.isFinite(Number(quote.totalAmount))) {
        return formatMoney(quote.totalAmount, quote.currency) || null;
    }
    return null;
}

export function summarizeRequests(requests) {
    const list = Array.isArray(requests) ? requests : [];
    let active = 0;
    let needsAction = 0;
    let completed = 0;
    for (const request of list) {
        const group = getRequestGroup(request);
        if (group === 'active') active += 1;
        else if (group === 'needs-action') needsAction += 1;
        else if (group === 'completed') completed += 1;
    }
    return { total: list.length, active, needsAction, completed };
}

const GROUP_RANK = { 'needs-action': 0, active: 1, completed: 2, closed: 3 };

function byNewest(a, b) {
    return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
}

// Case-insensitive, trimmed search over already-displayed fields only (device
// name, product category/brand/model, tracking id, service district/region).
export function requestMatchesSearch(request, query) {
    const needle = (query || '').trim().toLowerCase();
    if (!needle) return true;
    const { device, category, brandModel } = getProductSummary(request);
    const location = request?.serviceLocation || {};
    const haystack = [device, category, brandModel, request?.trackingId, location.district, location.region]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return haystack.includes(needle);
}

// Pure filter + sort pipeline over already-loaded requests. Default preserves
// newest-first (the app's existing expected ordering).
export function applyRequestView(requests, { search = '', group = 'all', sort = 'newest' } = {}) {
    let list = (Array.isArray(requests) ? requests : []).filter((request) => requestMatchesSearch(request, search));
    if (group !== 'all') {
        list = list.filter((request) => getRequestGroup(request) === group);
    }
    if (sort === 'oldest') {
        list = [...list].sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));
    } else if (sort === 'status') {
        // "Needs you first": the customer's to-dos, then in-flight repairs, then
        // finished, then cancelled - newest first within each. (This used to
        // sort raw status strings alphabetically, which meant nothing.)
        list = [...list].sort((a, b) => (GROUP_RANK[getRequestGroup(a)] - GROUP_RANK[getRequestGroup(b)]) || byNewest(a, b));
    } else {
        list = [...list].sort(byNewest);
    }
    return list;
}
